const fs = require('fs');
const chalk = require('chalk');
const csv2json = require('csvtojson');
const path = require('path');
const async = require('async');
const { MUTATION_CLEAR_AND_INSERT_PEOPLE,
  MUTATION_DELETE_CONSTITUENCIES, MUTATION_INSERT_CONSTITUENCIES,
  MUTATION_DELETE_CONSTITUENCY_PREDECESSORS, MUTATION_INSERT_CONSTITUENCY_PREDECESSORS,
  MUTATION_DELETE_COUNCILORS, MUTATION_INSERT_COUNCILORS,
  MUTATION_DELETE_CANDIDATES, MUTATION_INSERT_CANDIDATES,
  MUTATION_DELETE_VOTE_STATIONS, MUTATION_INSERT_VOTE_STATIONS,
  MUTATION_DELETE_DISTRICTS, MUTATION_INSERT_DISTRICTS,
  MUTATION_DELETE_COUNCILOR_ATTENDACES, MUTATION_INSERT_COUNCILOR_ATTENDANCES,
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

function getFloat(val, fallback) {
  const v = parseFloat(val, 10);
  if (Number.isNaN(v)) {
    return fallback;
  }
  return v;
}

function getStr(val, fallback) {
  if (!val || val === '#N/A') {
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
      estimated_yob: getInt(person.estimated_yob, null),
      gender: getStr(person.gender, null),
      fc_uuid: getStr(person.fc_uuid, null),
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

/**
 * For constituencies
 * @param {*} voters 
 * @param {*} newVoters 
 */
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

  pushData(voters.M, 'BY_GENDER_AGE', 'VOTERS', 'MALE');
  pushData(voters.F, 'BY_GENDER_AGE', 'VOTERS', 'FEMALE');
  pushData(newVoters.M, 'BY_GENDER_AGE', 'NEW_VOTERS', 'MALE');
  pushData(newVoters.F, 'BY_GENDER_AGE', 'NEW_VOTERS', 'FEMALE');
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
          vote_stats: voteStats,
        };
      }),
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

    log.info(`${insert_dcd_constituencies.affected_rows} new data inserted.`);
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

    log.info(`${insert_dcd_councillor_meeting_attendances.affected_rows} new data inserted.`);
  }

  log.info(`${records.length} councilor attendance in csv ..`);
}

async function importCandidates(filePath) {
  const records = await csv2json().fromFile(filePath);

  await runQuery(MUTATION_DELETE_CANDIDATES, null);

  const BATCH_SIZE = 500;
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
            nominated_at: getStr(record.nominated_at, null),
            nominate_status: getStr(record.nominate_status, null),
            votes: getInt(record.votes, 0),
            person_id: parseInt(record.person_id, 10),
            vote_percentage: getInt(record.vote_percentage, 0),
            election_type: getStr(record.election_type, null),
            constituency_id: getStr(record.constituency_id, null),
          };
        }),
    });

    if (res.statusCode !== 200) {
      console.error(JSON.stringify(res.body));
      throw new Error('Invalid response when inserting people');
    }

    console.log(res.body);
    const {
      data: {
        insert_dcd_candidates,
      },
    } = res.body;

    log.info(`${insert_dcd_candidates.affected_rows} new data inserted.`);
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

    log.info(`${insert_dcd_constituency_vote_stations.affected_rows} new data inserted.`);
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
  await importCouncilorAttendance(path.join(directory, 'dcd_councilor_attendances.csv'));
  await importConstitencyPredecessors(path.join(directory, 'dcd_constituency_predecessors.csv'));
}

module.exports = {
  importAll,
};
