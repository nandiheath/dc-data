const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));
const cheerio = require('cheerio');
const fs = require('fs');
const csv2json = require('csvtojson');
const chalk = require('chalk');
const { Parser } = require('json2csv');
const moment = require('moment');
const uuid = require('uuid/v4');
const { nameMatch } = require('./utils');
const { loadPeopleCampMapping } = require('./google');


// const getCampByPA = (pa) => {
//   const DEMOCRACY = ['民主黨', '民主動力', '新民主同盟', '民主派',
//     '天水連線', '民主陣線', '社區前進'];
//   const ESTABLISH = ['自由黨', '民主建港協進聯盟', '民建聯',
//     '工聯會', '香港工會聯合會', '經民聯'];
//   if (DEMOCRACY.find(p => pa.indexOf(p) >= 0)) {
//     return '泛民';
//   }

//   if (ESTABLISH.find(p => pa.indexOf(p) >= 0)) {
//     return '建制';
//   }

//   return '其他';
// }

// default logger
const log = {
  debug: msg => console.log(chalk.cyan(msg)),
  info: msg => console.log(chalk.yellow(msg)),
  error: msg => console.log(chalk.red(msg)),
};

async function getFactCheckPeople() {
  const uri = 'https://api.hkfactcheck.io/persons?region=_';
  const res = await request.getAsync({ uri, json: {} });
  const data = res.body;
  log.info(`loaded data from hkfactcheck. people size: ${data.length}`);
  return data;
}

const lookupPeople = (peopleFromCSV, name) => {
  const person = peopleFromCSV.find(p => nameMatch(p.name_zh, name));
  if (!person) {
    return null;
  }
  return person;
};

const lookupFactCheckPeople = (factcheckPeople, name) => {
  const person = factcheckPeople.find(p => nameMatch(p.name, name));
  return person;
};

const getCampFromHKFactcheck = (pf) => {
  switch (pf) {
    case 'PROESTAB': return '建制';
    case 'PANDEMO': return '民主';
    case 'OTHER': return '其他';
    default: return null;
  }
};

const lookupCampForPerson = (mappings, name, cacode) => {
  const mapping = mappings.find(m => m.cacode === cacode && nameMatch(m.name, name));
  if (!mapping) {
    return null;
  }

  return mapping.camp;
};

const getDate = (d) => {
  if (moment(d, 'DD/MM/YYYY').isValid()) {
    return moment(d, 'DD/MM/YYYY').format('YYYY-MM-DD');
  }

  return moment(d, 'YYYY年MM月DD日').format('YYYY-MM-DD');
};

const scrapeNominate = async (csvDirectory, outputDirectory) => {
  // download the mapping first
  const campMapping = await loadPeopleCampMapping();
  log.info(`total ${campMapping.length} people-camp mapping found.`);

  // Load the person csv first
  const people = await csv2json().fromFile(`${csvDirectory}/dcd_people.csv`);
  const fcPeople = await getFactCheckPeople();

  // Get the last people id
  let peopleStartingId = people.map(p => p.id).reduce((c, v) => Math.max(c, v), 0) + 1;
  let candidatesStartingId = 4406;

  const nomiateSourceURL = 'https://www.elections.gov.hk/dc2019/chi/nominat2.html';
  let res = await request.getAsync(nomiateSourceURL);
  const content = res.body;
  let $ = cheerio.load(content);
  const list = $('div.contents').find('td').find('a');

  const htmlList = [];
  list.each((i, ele) => {
    const name = $(ele).text();
    const url = $(ele).attr('href');
    if (name === ' 純文字格式') {
      htmlList.push(url.replace('../pdf', 'https://www.elections.gov.hk/dc2019/pdf'));
    }
  });

  if (htmlList.length === 0) {
    log.error('unable to load the list from gov. please check the source path');
    return;
  }

  const candidates = [];
  const newPeople = [];

  for (const url of htmlList) {
    res = await request.getAsync(url);
    $ = cheerio.load(res.body);
    const rows = $('body').find('table').find('tr');
    // eslint-disable-next-line no-loop-func
    rows.each((i, ele) => {
      const columns = $(ele).find('td');
      const code = columns.first().text();
      if (code.trim() === '') {
        return;
      }
      const fields = [];
      columns.each((j, col) => {
        fields.push($(col).text());
      });

      // Speical handling
      let name = fields[2];
      if (name === 'BUX SHEIK ANTHONY') {
        name = '畢東尼';
      } else if (name === '林淑\uE3C5') {
        name = '林淑菁';
      }

      const person = lookupPeople(people, name);
      const fcPerson = lookupFactCheckPeople(fcPeople, name);
      let newPersonId = null;
      let camp = null;
      if (fcPerson) {
        camp = getCampFromHKFactcheck(fcPerson.politicalFaction);
      }
      if (!person) {
        log.error(`person ${name} not found. gonna create in people.csv`);
        newPersonId = peopleStartingId++;
        newPeople.push({
          id: newPersonId,
          name_en: null,
          name_zh: name,
          estimated_yob: null,
          gender: fields[4] === '男' ? 'MALE' : 'FEMALE',
          related_organization: fields[6],
          uuid: uuid(),
          fc_uuid: fcPerson ? fcPerson.personId : null,
        });
      }

      const campOverride = lookupCampForPerson(campMapping, name, code);
      camp = campOverride || camp;
      // id,name_zh,name_en,election_type,person_id,matched,year,cacode,constituency_id,age,political_affiliation,camp,candidate_number,occupation,votes,vote_percentage,is_won
      candidates.push({
        id: candidatesStartingId++,
        name_zh: name,
        name_en: '',
        election_type: 'ordinary',
        person_id: person ? parseInt(person.id, 10) : (fcPerson ? newPersonId : null),
        matched: null,
        year: 2019,
        cacode: code,
        constituency_id: null,
        age: null,
        political_affiliation: fields[6],
        camp,
        candidate_number: null,
        occupation: fields[5],
        nominated_at: getDate(fields[7]),
        nominate_status: 'nominated',
        votes: 0,
        vote_percentage: 0,
        is_won: false,
      });
    });
  }

  log.info(`total ${candidates.length} candiates crawled.`);
  log.info(`and total ${newPeople.length} new candidates.`);
  let parser = new Parser({});
  let csv = parser.parse(candidates);
  fs.writeFileSync(`${outputDirectory}/nominated_candidates.csv`, csv);

  if (newPeople.length > 0) {
    parser = new Parser({});
    csv = parser.parse(newPeople);
    fs.writeFileSync(`${outputDirectory}/nominated_people.csv`, csv);
  }
};

module.exports = {
  scrapeNominate,
};
