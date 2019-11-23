#!/usr/bin/env node

const program = require('commander');
require('dotenv').config();

const { getStr, getInt, log } = require('./lib/importer');
const { loadCandidates, loadPeople, loadConstituencies } = require('./lib/google');
const {
  MUTATION_UPDATE_PERSON,
  MUTATION_UPDATE_CANDIDATE,
  MUTATION_UPDATE_CONSTITUENCY,
  MUTATION_UPDATE_CONFIG,
} = require('./lib/gql');
const { runQuery } = require('./lib/hasura');

async function updateGovTurnout() {
  try {
    const res = await runQuery(MUTATION_UPDATE_CONFIG, {
      key: 'gov_turnout_rate',
      value: {
        A01: [],
      },
    });

    if (res.statusCode !== 200 || !res.body.data.affected_rows) {
      throw res.body.data;
    }
  } catch (error) {
    log.error('error when updating config');
    console.error(error);
  }
  log.info('config update completed');
}

async function updateConstituencies(fromIdStr, toIdStr) {
  const fromId = parseInt(fromIdStr, 10);
  const toId = parseInt(toIdStr, 10);
  if (fromId > toId) {
    log.error('Invalid from_id and to_id');
    return;
  }

  const constituencies = await loadConstituencies(fromId, toId);
  // id	code	district_id	year	name_en	name_zh	expected_population	deviation_percentage	tags	meta_tags	main_areas	boundaries	voters	new_voters	description

  let updateCount = 0;
  for (let i = 0; i < constituencies.length; i += 1) {
    const constituency = constituencies[i];
    const [constituency_id, , , , , , , , tags, meta_tags, , , , , description, description_zh, description_en, meta] = constituency;
    // hasura update
    try {
      const res = await runQuery(MUTATION_UPDATE_CONSTITUENCY, {
        constituencyId: getInt(constituency_id, null),
        updateInput: {
          description,
          description_zh,
          description_en,
          meta: JSON.parse(meta),
        },
      });

      if (res.statusCode !== 200 || !res.body.data.update_dcd_constituencies) {
        throw res.body.data;
      }

      updateCount += 1;
    } catch (error) {
      log.error(`error when updating constituency_id :${constituency_id}`);
      console.error(error);
    }
    log.info('batch update completed');
    log.info(`constituencies updated: ${updateCount}/${constituencies.length}`);
  }

}

async function updateCandidate(fromIdStr, toIdStr) {
  const fromId = parseInt(fromIdStr, 10);
  const toId = parseInt(toIdStr, 10);
  if (fromId > toId) {
    log.error('Invalid from_id and to_id');
    return;
  }

  const people = await loadPeople();
  const candidates = await loadCandidates(fromId, toId);
  if (candidates.length === 0 || people.length === 0) {
    log.error('error when loading data from google spreadsheet');
    return;
  }

  let candidatesUpdateCount = 0;
  let peopleUpdateCount = 0;
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const [candidate_id, cname_zh, cname_en, , person_id, , , cacode, , , political_affiliation, camp, candidate_number, occupation, nominated_at, nominate_status, votes, is_won, fb_id, ig_id, tags, occupation_zh, occupation_en, political_affiliation_zh, political_affiliation_en, electoral_message_zh, electoral_message_en, email_or_website] = candidate;
    const person = people.find(p => p[0] === person_id);
    if (person === null) {
      log.error(`people not found for candidata_id:${candidate_id} [${cname_zh}]`);
      continue;
    }

    // hasura update
    // update candidate first
    try {
      const res = await runQuery(MUTATION_UPDATE_CANDIDATE, {
        candidateId: getInt(candidate_id, null),
        updateInput: {
          political_affiliation: getStr(political_affiliation, null),
          camp,
          occupation: getStr(occupation, null),
          nominated_at: getStr(nominated_at, null),
          nominate_status: getStr(nominate_status, null),
          candidate_number: getStr(candidate_number, null),
          fb_id: getStr(fb_id, null),
          ig_id: getStr(ig_id, null),
          occupation_zh: getStr(occupation_zh, null),
          occupation_en: getStr(occupation_en, null),
          political_affiliation_zh: getStr(political_affiliation_zh, null),
          political_affiliation_en: getStr(political_affiliation_en, null),
          electoral_message_zh: getStr(electoral_message_zh, null),
          electoral_message_en: getStr(electoral_message_en, null),
          email_or_website: getStr(email_or_website, null),
          votes: getInt(votes, 0),
          is_won: getStr(is_won, 'false') === 'false',
        },
        tags: tags && tags.length > 0 ? tags.split(',').filter(t => t.length > 0).map((entry) => {
          const [type, tag] = entry.split(':');
          return {
            candidate_id: getInt(candidate_id, null), tag, type,
          };
        }) : [],
      });

      if (res.statusCode !== 200 || !res.body.data.update_dcd_candidates) {
        throw res.body.data;
      }

      candidatesUpdateCount += 1;
    } catch (error) {
      log.error(`error when updating candidate_id :${candidate_id}`);
      log.error(error);
    }


    try {
      // id	name_en	name_zh	estimated_yob	yod	gender	related_organization	related_organization_zh	related_organization_en	uuid	fc_uuid	description_zh	description_en
      const [, name_en, name_zh, estimated_yob, yod, gender, related_organization, related_organization_zh, related_organization_en, uuid, fc_uuid, description_zh, description_en] = person;
      const res = await runQuery(MUTATION_UPDATE_PERSON, {
        personId: getInt(person_id, null),
        updateInput: {
          name_zh: getStr(name_zh, null),
          name_en: getStr(name_en, null),
          related_organization_zh: getStr(related_organization_zh, null),
          related_organization_en: getStr(related_organization_en, null),
          estimated_yob: getInt(estimated_yob, null),
          gender: getStr(gender, null),
          fc_uuid: getStr(fc_uuid, null),
          description: getStr(description_zh, null), // to be deprecated
          description_zh: getStr(description_zh, null),
          description_en: getStr(description_en, null),
        },
      });

      if (res.statusCode !== 200 || !res.body.data.update_dcd_people) {
        throw res.body.data;
      }

      peopleUpdateCount += 1;
    } catch (error) {
      log.error(`error when updating person. candidate_id: ${candidate_id}, person_id: ${person_id}`);
      log.error(error);
    }

    log.info('batch update completed');
    log.info(`candidates updated: ${candidatesUpdateCount}/${candidates.length}`);
    log.info(`people updated: ${peopleUpdateCount}/${candidates.length}`);
  }


  // loadPersonById
  // id	name_en	name_zh	estimated_yob	gender	related_organization	uuid	fc_uuid	description
}

program
  .version('0.1.0');

program
  .command('candidates <fromId> <toId>')
  .description('update the candidate from master data sheet and import to hasura directly')
  .action(updateCandidate);

program
  .command('constituencies <fromId> <toId>')
  .description('update the constituencies from master data sheet and import to hasura directly')
  .action(updateConstituencies);

program
  .command('turnout')
  .description('update the turnout data')
  .action(updateGovTurnout);

program.parse(process.argv);

// If no arguments we should output the help
if (!program.args.length) program.help();
