const fs = require('fs');
const chalk = require('chalk');
const csv2json = require('csvtojson');
const path = require('path');
const _ = require('lodash');
const Xray = require('X-ray');

const {
  MUTATION_CLEAR_AND_INSERT_PEOPLE,
  MUTATION_DELETE_CONSTITUENCIES, MUTATION_INSERT_CONSTITUENCIES,
  MUTATION_DELETE_CONSTITUENCY_PREDECESSORS, MUTATION_INSERT_CONSTITUENCY_PREDECESSORS,
  MUTATION_DELETE_CONSTITUENCY_VOTE_STATS,
  MUTATION_INSERT_CONSTITUENCY_VOTE_STATS,
  MUTATION_DELETE_COUNCILORS, MUTATION_INSERT_COUNCILORS,
  MUTATION_DELETE_CANDIDATES, MUTATION_INSERT_CANDIDATES,
  MUTATION_DELETE_VOTE_STATIONS, MUTATION_INSERT_VOTE_STATIONS,
  MUTATION_DELETE_DISTRICTS, MUTATION_INSERT_DISTRICTS,
  MUTATION_DELETE_COUNCILOR_ATTENDACES, MUTATION_INSERT_COUNCILOR_ATTENDANCES,
} = require('./gql');
const { runQuery } = require('./hasura');


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

function getFloat(val, fallback) {
  const v = parseFloat(val, 10);
  if (Number.isNaN(v)) {
    return fallback;
  }
  return v;
}

function getStr(val, fallback) {
  if (!val || val === '#N/A' || val === 'n/a' || val === '-') {
    return fallback;
  }
  return val;
}


async function importPeople(filePath) {
  const people = await csv2json().fromFile(filePath);
  const res = await runQuery(MUTATION_CLEAR_AND_INSERT_PEOPLE, {
    objects: people.map(person => ({
      id: person.id,
      uuid: getStr(person.uuid, null),
      name_zh: getStr(person.name_zh, null),
      name_en: getStr(person.name_en, null),
      related_organization: getStr(person.related_organization, null),
      related_organization_zh: getStr(person.related_organization_zh, null),
      related_organization_en: getStr(person.related_organization_en, null),
      estimated_yob: getInt(person.estimated_yob, null),
      yod: getInt(person.yod, null),
      gender: getStr(person.gender, null),
      fc_uuid: getStr(person.fc_uuid, null),
      description: getStr(person.description, null),
      description_zh: getStr(person.description_zh, null),
      description_en: getStr(person.description_en, null),
    })),
  });

  if (res.statusCode !== 200 || !res.body.data) {
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

/**
 * For constituencies
 * @param {*} voters
 * @param {*} newVoters
 */
function getVoteStats(constituency_id, type, voters, newVoters) {
  const data = [];

  function pushData(arr, subtype, cat1) {
    Object.keys(arr).forEach((key) => {
      const val = arr[key];
      data.push({
        constituency_id,
        type,
        subtype,
        category_1: cat1,
        category_2: key,
        count: parseInt(val, 10),
      });
    });
  }

  pushData(voters.M, 'VOTERS', 'MALE');
  pushData(voters.F, 'VOTERS', 'FEMALE');
  pushData(newVoters.M, 'NEW_VOTERS', 'MALE');
  pushData(newVoters.F, 'NEW_VOTERS', 'FEMALE');
  return data;
}

/**
 * For vote station stats ()
 * @param {*} voters
 * @param {*} newVoters
 */
function getStationVoteStats(record) {
  const data = [];
  Object.keys(record).forEach((key) => {
    if (key.match(/\d{2}_(\d{2}|above)_(male|female)/)) {
      const tokens = key.split('_');

      data.push({
        type: 'BY_GENGER_AGE',
        subtype: 'VOTED',
        category_1: tokens[2].toUpperCase(),
        category_2: `${tokens[0]}${tokens[1] === 'above' ? '+' : `-${tokens[1]}`}`,
        count: parseInt(record[key], 10),
      });
    }
  });
  return data;
}


async function importDistricts(filePath) {
  const records = await csv2json().fromFile(filePath);

  await runQuery(MUTATION_DELETE_DISTRICTS, null);

  const res = await runQuery(MUTATION_INSERT_DISTRICTS, {
    objects: records,
  });


  if (res.statusCode !== 200) {
    console.error(res.body);
    throw new Error('Invalid response when inserting people');
  }

  const {
    data: {
      insert_dcd_districts,
    },
  } = res.body;

  log.info(`${insert_dcd_districts.affected_rows} new data inserted.`);
  log.info(`${records.length} districts in csv ..`);
}

async function importConstituencyVoteStats(filePath) {
  const records = await csv2json().fromFile(filePath);

  await runQuery(MUTATION_DELETE_CONSTITUENCY_VOTE_STATS, null);

  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length / BATCH_SIZE; i += 1) {
    const start = i * BATCH_SIZE;
    const end = Math.min((i + 1) * BATCH_SIZE, records.length);
    const res = await runQuery(MUTATION_INSERT_CONSTITUENCY_VOTE_STATS, {
      objects: _.flatten(
        records.slice(start, end).map(
          record => getVoteStats(getInt(record.constituency_id, 0), `YEAR_${getInt(record.data_year, 0) - getInt(record.election_year, 0)}`, JSON.parse(record.voters), JSON.parse(record.new_voters)),
        ),
      ),
    });

    if (res.statusCode !== 200) {
      console.error(JSON.stringify(res.body));
      throw new Error('Invalid response when inserting constituency stats');
    }

    const {
      data: {
        insert_dcd_constituency_vote_stats,
      },
    } = res.body;

    log.info(`${insert_dcd_constituency_vote_stats.affected_rows} new data inserted.`);
  }

  log.info(`${records.length} constituency predecessors in csv ..`);
}

async function importConstituencies(filePath) {
  const records = await csv2json().fromFile(filePath);

  await runQuery(MUTATION_DELETE_CONSTITUENCIES, null);

  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length / BATCH_SIZE; i += 1) {
    const start = i * BATCH_SIZE;
    const end = Math.min((i + 1) * BATCH_SIZE, records.length);
    const res = await runQuery(MUTATION_INSERT_CONSTITUENCIES, {
      objects: records.slice(start, end).map(record => ({
        id: record.id,
        code: record.code,
        district_id: record.district_id,
        year: getInt(record.year),
        name_en: getStr(record.name_en, null),
        name_zh: getStr(record.name_zh, null),
        expected_population: getInt(record.expected_population, 0),
        deviation_percentage: getInt(record.deviation_percentage, 0),
        tags: {
          data: [
            ...record.tags.split(',').filter(t => t.length > 0).map(tag => ({ tag, type: 'boundary' })),
            ...record.meta_tags.split(',').filter(t => t.length > 0).map(tag => ({ tag, type: 'meta' })),
          ],
        },
        main_areas: JSON.parse(record.main_areas),
        boundaries: JSON.parse(record.boundaries),
        description: getStr(record.description, null),
        description_zh: getStr(record.description_zh, null),
        description_en: getStr(record.description_en, null),
      })),
    });

    if (res.statusCode !== 200) {
      console.error(JSON.stringify(res.body));
      throw new Error('Invalid response when inserting constituencies');
    }

    const {
      data: {
        insert_dcd_constituencies,
      },
    } = res.body;

    log.info(`${insert_dcd_constituencies.affected_rows} new constituencies inserted.`);
  }

  log.info(`${records.length} constituencies in csv ..`);
}

async function importConstitencyPredecessors(filePath) {
  const records = await csv2json().fromFile(filePath);

  await runQuery(MUTATION_DELETE_CONSTITUENCY_PREDECESSORS, null);

  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length / BATCH_SIZE; i += 1) {
    const start = i * BATCH_SIZE;
    const end = Math.min((i + 1) * BATCH_SIZE, records.length);
    const res = await runQuery(MUTATION_INSERT_CONSTITUENCY_PREDECESSORS, {
      objects: records.slice(start, end).map(record => ({
        id: record.id,
        constituency_id: getInt(record.constituency_id, null),
        previous_constituency_id: getInt(record.previous_constituency_id, null),
        intersect_area: getFloat(record.intersect_area, null),
      })),
    });

    if (res.statusCode !== 200) {
      console.error(JSON.stringify(res.body));
      throw new Error('Invalid response when inserting constituency predecessors');
    }

    const {
      data: {
        insert_dcd_constituency_predecessors,
      },
    } = res.body;

    log.info(`${insert_dcd_constituency_predecessors.affected_rows} new data inserted.`);
  }

  log.info(`${records.length} constituency predecessors in csv ..`);
}

async function importCouncilors(filePath) {
  const name = 'concillors';
  const records = await csv2json().fromFile(filePath);

  await runQuery(MUTATION_DELETE_COUNCILORS, null);

  const BATCH_SIZE = 500;
  for (let i = 0; i < records.length / BATCH_SIZE; i += 1) {
    const start = i * BATCH_SIZE;
    const end = Math.min((i + 1) * BATCH_SIZE, records.length);
    const res = await runQuery(MUTATION_INSERT_COUNCILORS, {
      objects: records.slice(start, end)
        .map((record) => {
          return {
            id: record.id,
            cacode: record.cacode.match(/\w\d\d/) ? record.cacode : null,
            term_from: getStr(record.term_from, null),
            term_to: getStr(record.term_to, null),
            year: getInt(record.year, null),
            career: getStr(record.career, null),
            capacity: getStr(record.capacity, null),
            post: getStr(record.post, null),
            person_id: getInt(record.dc_people_id),
            district_id: record.district_id,
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
            constituency_id: getStr(record.constituency_id, null),
          };
        }),
    });

    if (res.statusCode !== 200) {
      console.error(`error when inserting ${i * BATCH_SIZE} - ${(i + 1) * BATCH_SIZE} concillors`);
      console.error(JSON.stringify(res.body));
      throw new Error(`invalid response when inserting ${name}`);
    }

    const {
      data: {
        insert_dcd_councillors,
      },
    } = res.body;

    log.info(`${insert_dcd_councillors.affected_rows} ${name}s inserted.`);
  }

  log.info(`finished importing ${records.length} ${name} in csv ..`);
}

async function importCouncilorAttendance(filePath) {
  const records = await csv2json().fromFile(filePath);

  await runQuery(MUTATION_DELETE_COUNCILOR_ATTENDACES, null);

  const BATCH_SIZE = 500;
  for (let i = 0; i < records.length / BATCH_SIZE; i += 1) {
    const start = i * BATCH_SIZE;
    const end = Math.min((i + 1) * BATCH_SIZE, records.length);
    const res = await runQuery(MUTATION_INSERT_COUNCILOR_ATTENDANCES, {
      objects: records.slice(start, end)
        .map((record, index) => ({
          id: start + index + 1,
          attended: getInt(record.attended, null),
          total: getInt(record.total, null),
          councilor_id: getInt(record.councilor_id, null),
          meeting: {
            data: {
              meet_name: record.meet_name,
              meet_type: record.meet_type,
              council_year: getInt(record.council_year, null),
              district_id: getInt(record.district_id, null),
              meet_year: getInt(record.meet_year, null),
            },
            on_conflict: {
              constraint: 'dcd_councilor_meetings_meet_name_meet_type_meet_year_district_i',
              update_columns: ['meet_name'],
            },
          },
        })),
    });

    if (res.statusCode !== 200) {
      console.error(JSON.stringify(res.body));
      throw new Error('Invalid response when inserting councilor meeting attendances');
    }

    const {
      data: {
        insert_dcd_councillor_meeting_attendances,
      },
    } = res.body;

    log.info(`${insert_dcd_councillor_meeting_attendances.affected_rows} new councillor_meeting_attendances inserted.`);
  }

  log.info(`${records.length} councilor attendance in csv ..`);
}

async function importCandidates(filePath) {
  const records = await csv2json().fromFile(filePath);

  await runQuery(MUTATION_DELETE_CANDIDATES, null);

  const BATCH_SIZE = 10;
  for (let i = 0; i < records.length / BATCH_SIZE; i += 1) {
    const start = i * BATCH_SIZE;
    const end = Math.min((i + 1) * BATCH_SIZE, records.length);
    const res = await runQuery(MUTATION_INSERT_CANDIDATES, {
      objects: records.slice(start, end)
        .map((record) => {
          return {
            id: record.id,
            year: parseInt(record.year, 10),
            cacode: record.cacode,
            candidate_number: getStr(record.candidate_number, null),
            political_affiliation: getStr(record.political_affiliation, null),
            camp: record.camp,
            age: getInt(record.age, null),
            is_won: record.is_won === 'TRUE',
            occupation: getStr(record.occupation, null),
            occupation_zh: getStr(record.occupation_zh, null),
            occupation_en: getStr(record.occupation_en, null),
            political_affiliation_zh: getStr(record.political_affiliation_zh, null),
            political_affiliation_en: getStr(record.political_affiliation_en, null),
            electoral_message_zh: getStr(record.electoral_message_zh, null),
            electoral_message_en: getStr(record.electoral_message_en, null),
            email_or_website: getStr(record.email_or_website, null),
            nominated_at: getStr(record.nominated_at, null),
            nominate_status: getStr(record.nominate_status, null),
            votes: getInt(record.votes, 0),
            person_id: parseInt(record.person_id, 10),
            vote_percentage: getInt(record.vote_percentage, 0),
            election_type: getStr(record.election_type, null),
            constituency_id: getStr(record.constituency_id, null),
            fb_id: getStr(record.fb_id, null),
            ig_id: getStr(record.ig_id, null),
            tags: {
              data: [
                ...record.tags.split(',').filter(t => t.length > 0).map((entry) => {
                  const [type, tag] = entry.split(':');
                  return {
                    tag, type,
                  };
                }),
              ],
            },
          };
        }),
    });

    if (res.statusCode !== 200) {
      console.error(JSON.stringify(res.body));
      log.error('error in inserting data.');
      log.error(res.body);
      log.error(`row: ${start} - ${end}`);
      throw new Error('Invalid response when inserting candidates');
    }

    // const {
    //   data,
    // } = res.body;


    // log.info(`${insert_dcd_candidates.affected_rows} candidates inserted.`);
  }

  log.info(`${records.length} candidates in csv ..`);
}

async function importVoteStations(filePath) {
  const records = await csv2json().fromFile(filePath);

  await runQuery(MUTATION_DELETE_VOTE_STATIONS, null);

  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length / BATCH_SIZE; i += 1) {

    const start = i * BATCH_SIZE;
    const end = Math.min((i + 1) * BATCH_SIZE, records.length);

    const res = await runQuery(MUTATION_INSERT_VOTE_STATIONS, {
      objects: records.slice(start, end).map((record) => {
        let voteStats = null;
        if (record.voters !== '') {
          voteStats = {
            data: getStationVoteStats(record),
          };
        }
        return {
          id: record.id,
          constituency_id: record.constituency_id,
          station_code: record.code,
          name_en: getStr(record.name_en, null),
          name_zh: getStr(record.name_zh, null),
          year: getInt(record.year, null),
          location: {
            type: 'Point',
            coordinates: [114.0149868, 22.4544636],
          },
          vote_stats: voteStats,
        };
      }),
    });

    if (res.statusCode !== 200) {
      console.error(JSON.stringify(res.body));
      throw new Error('Invalid response when inserting vote stations');
    }

    const {
      data: {
        insert_dcd_constituency_vote_stations,
      },
    } = res.body;

    log.info(`${insert_dcd_constituency_vote_stations.affected_rows} new vote_stations inserted.`);
  }

  log.info(`${records.length} vote_station_stats in csv ..`);
}

async function importVoteStations2019(filePath) {
  const records = await csv2json().fromFile(filePath);

  // wont delete data as we have import the previous year's data

  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length / BATCH_SIZE; i += 1) {

    const start = i * BATCH_SIZE;
    const end = Math.min((i + 1) * BATCH_SIZE, records.length);

    const res = await runQuery(MUTATION_INSERT_VOTE_STATIONS, {
      objects: records.slice(start, end).map(record => ({
        id: record.id,
        constituency_id: record.constituency_id,
        station_code: record.station_code,
        name_en: getStr(record.name_en, null),
        name_zh: getStr(record.name_zh, null),
        address_en: getStr(record.address_en, null),
        address_zh: getStr(record.address_zh, null),
        year: getInt(record.year, null),
        location: {
          type: 'Point',
          coordinates: [getFloat(record.lng, 0), getFloat(record.lat, 0)],
        },
      })),
    });

    if (res.statusCode !== 200) {
      console.error(JSON.stringify(res.body));
      throw new Error('Invalid response when inserting vote stations');
    }

    const {
      data: {
        insert_dcd_constituency_vote_stations,
      },
    } = res.body;

    log.info(`${insert_dcd_constituency_vote_stations.affected_rows} new vote_stations inserted.`);
  }

  log.info(`${records.length} vote_station_stats in csv ..`);
}

async function importAll(directory) {
  if (!fs.existsSync(directory)) {
    log.error('File does not exists');
    return;
  }


  await importDistricts(path.join(directory, 'dcd_districts.csv'));
  await importPeople(path.join(directory, 'dcd_people.csv'));
  await importConstituencies(path.join(directory, 'dcd_constituencies.csv'));
  await importCouncilors(path.join(directory, 'dcd_councilors.csv'));
  await importCandidates(path.join(directory, 'dcd_candidates.csv'));
  await importVoteStations(path.join(directory, 'dcd_vote_station_stats.csv'));
  await importVoteStations2019(path.join(directory, 'dcd_vote_stations.csv'));
  await importCouncilorAttendance(path.join(directory, 'dcd_councilor_attendances.csv'));
  await importConstitencyPredecessors(path.join(directory, 'dcd_constituency_predecessors.csv'));
  await importConstituencyVoteStats(path.join(directory, 'dcd_constituency_voters.csv'));
}

const getGovTurnouts = async () => {
  const turnoutUrls = {
    total: 'https://www.elections.gov.hk/dc2019/chi/turnout.html',
    A: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_central_western.html',
    B: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_wan_chai.html',
    C: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_eastern.html',
    D: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_southern.html',
    E: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_yau_tsim_mong.html',
    F: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_sham_shui_po.html',
    G: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_kowloon_city.html',
    H: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_wong_tai_sin.html',
    J: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_kwun_tong.html',
    K: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_tsuen_wan.html',
    L: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_tuen_mun.html',
    M: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_yuen_long.html',
    N: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_north.html',
    P: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_tai_po.html',
    Q: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_sai_kung.html',
    R: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_sha_tin.html',
    S: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_kwai_tsing.html',
    T: 'https://www.elections.gov.hk/dc2019/chi/turnout_18d_islands.html',
  };

  const x = Xray();

  const crawlTurnout = (url, code) => {
    // console.debug(`Crawling data for gov turnout ${url}`);

    return x(url, '#table-district-member tr', [
      {
        time: 'td:nth-child(1)',
        count: 'td:nth-child(2)',
        percent: 'td:nth-child(3)',
      },
    ]).then((res) => {
      const clean = res.map((r) => ({
        time: r.time,
        count: parseInt(r.count.replace(/,/g, '')) || null, // Change 123,456 to 123456
        percent: parseInt(r.percent) || null,
      }));

      // console.debug(`Crawled data for gov turnout ${url}`);
      // console.debug(clean);

      const results = clean.map(c => c.count);
      return {
        code,
        results,
      };
    }).catch((err) => {
      console.log(err);
      return {};
    });
  };

  const results = _.map(turnoutUrls, (url, code) => {
    return crawlTurnout(url, code);
  });

  return Promise.all(results).then(res => {
    return res;
  });
};

module.exports = {
  importAll,
  getStr,
  getInt,
  log,
  getGovTurnouts,
};
