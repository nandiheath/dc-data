const fs = require('fs');
const chalk = require('chalk');
const csv2json = require('csvtojson');
const path = require('path');
const async = require('async');
const { MUTATION_CLEAR_AND_INSERT_PEOPLE,
  MUTATION_DELETE_CONSTITUENCIES, MUTATION_INSERT_CONSTITUENCIES,
  MUTATION_DELETE_COUNCILORS, MUTATION_INSERT_COUNCILORS,
} = require('./gql');
const { runQuery } = require('./hasura');
const _ = require('lodash');

// default logger
const log = {
  debug: msg => console.log(chalk.cyan(msg)),
  info: msg => console.log(chalk.yellow(msg)),
  error: msg => console.log(chalk.red(msg)),
};

function getInt(val, fallback) {
  const v = parseInt(val, 10);
  if (Number.isNaN(v)) {
    return fallback;
  }
  return v;
}

function getStr(val, fallback) {
  if (!val || val === "#N/A") {
    return fallback;
  }
  return val;
}


async function importPeople(filePath) {
  const people = await csv2json().fromFile(filePath);
  const res = await runQuery(MUTATION_CLEAR_AND_INSERT_PEOPLE, {
    objects: people.map(person => ({
      id: person.id,
      name_zh: person.name_zh,
      name_en: person.name_en,
      estimated_yob: person.estimated_yob || null,
      gender: 'MALE',
    })),
  });

  if (res.statusCode !== 200) {
    console.error(res.body);
    throw new Error('Invalid response when inserting people');
  }

  const {
    data: {
      delete_dcd_people,
      insert_dcd_people,
    },
  } = res.body;

  log.info(`${people.length} people in csv ..`);
  log.info(`${delete_dcd_people.affected_rows} old data deleted.`);
  log.info(`${insert_dcd_people.affected_rows} new data inserted.`);
}

function getVoteStats(voters, newVoters) {
  const data = [];

  function pushData(arr, type, subtype, cat1) {
    Object.keys(arr).forEach((key) => {
      const val = arr[key];
      data.push({
        type,
        subtype,
        category_1: cat1,
        category_2: key,
        count: parseInt(val, 10),
      });
    });
  }

  pushData(voters.M, 'GENDER_AGE', 'VOTERS', 'MALE');
  pushData(voters.F, 'GENDER_AGE', 'VOTERS', 'FEMALE');
  pushData(newVoters.M, 'GENDER_AGE', 'NEW_VOTERS', 'MALE');
  pushData(newVoters.F, 'GENDER_AGE', 'NEW_VOTERS', 'FEMALE');
  return data;
}

async function importConstituencies(filePath) {
  const records = await csv2json().fromFile(filePath);

  await runQuery(MUTATION_DELETE_CONSTITUENCIES, null);

  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length / BATCH_SIZE; i += 1) {
    const start = i * BATCH_SIZE;
    const end = Math.min((i + 1) * BATCH_SIZE, records.length);
    const res = await runQuery(MUTATION_INSERT_CONSTITUENCIES, {
      objects: records.slice(start, end).map((record) => {
        let voteStats = null;
        if (record.voters !== '') {
          voteStats = {
            data: getVoteStats(JSON.parse(record.voters), JSON.parse(record.new_voters)),
          };
        }
        return {
          id: record.id,
          code: record.code,
          year: getInt(record.year),
          name_en: getStr(record.name_en, null),
          name_zh: getStr(record.name_zh, null),
          expected_population: getInt(record.expected_population, 0),
          deviation_percentage: getInt(record.deviation_percentage, 0),
          tags: {
            data: record.tags.split(',').filter(t => t.length > 0).map(tag => ({ tag })),
          },
          main_areas: JSON.parse(record.main_areas),
          boundaries: JSON.parse(record.boundaries),
          vote_stats: voteStats,
        };
      }),
    });

    if (res.statusCode !== 200) {
      console.error(res.body);
      throw new Error('Invalid response when inserting people');
    }

    const {
      data: {
        insert_dcd_constituencies,
      },
    } = res.body;

    log.info(`${insert_dcd_constituencies.affected_rows} new data inserted.`);
  }

  log.info(`${records.length} constituencies in csv ..`);
}

async function importCouncilors(filePath) {
  const records = await csv2json().fromFile(filePath);

  await runQuery(MUTATION_DELETE_COUNCILORS, null);

  const BATCH_SIZE = 500;
  for (let i = 0; i < records.length / BATCH_SIZE; i += 1) {
    const start = i * BATCH_SIZE;
    const end = Math.min((i + 1) * BATCH_SIZE, records.length);
    const res = await runQuery(MUTATION_INSERT_COUNCILORS, {
      objects: records.slice(start, end).filter(record => record.cacode.match(/\w\d\d/))
        .map((record) => {
          return {
            id: record.id,
            cacode: record.cacode,
            year: getInt(record.year),
            term_from: getStr(record.term_from, null),
            term_to: getStr(record.term_to, null),
            career: getStr(record.career, null),
            capacity: getStr(record.capacity, null),
            post: getStr(record.post, null),
            person_id: getInt(record.dc_people_id),
            meta: {
              honor: getStr(record.honor, '').split(','),
              address: getStr(record.address, null),
              tel: getStr(record.tel, null),
              fax: getStr(record.fax, null),
              email: getStr(record.email, null),
              website: getStr(record.website, null),
              facebook: getStr(record.facebook, null),
              declaration_url: getStr(record.declaration_url, null),
              image_url: getStr(record.image_url, null),
            },
            political_affiliation: getStr(record.political_affiliation, null),
            services: getStr(record.service, '').split(','),
          };
        }),
    });

    if (res.statusCode !== 200) {
      console.error(JSON.stringify(res.body));
      throw new Error('Invalid response when inserting people');
    }

    const {
      data: {
        insert_dcd_councilors,
      },
    } = res.body;

    log.info(`${insert_dcd_councilors.affected_rows} new data inserted.`);
  }

  log.info(`${records.length} constituencies in csv ..`);

}

async function importAll(directory) {
  if (!fs.existsSync(directory)) {
    log.error('File does not exists');
    return;
  }

  // await importPeople(path.join(directory, 'dcd_people.csv'));
  await importConstituencies(path.join(directory, 'dcd_constituencies.csv'));
  // await importCouncilors(path.join(directory, 'dcd_councilors.csv'));
}


async function runParallelFunc(iterable, func) {

}

module.exports = {
  importAll,
};
