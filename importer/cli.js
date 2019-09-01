#!/usr/bin/env node

const program = require('commander');

const async = require('async');
const { importAll } = require('./lib/importer');

require('dotenv').config();

// default logger
const log = {
  debug: msg => console.log(chalk.cyan(msg)),
  info: msg => console.log(chalk.yellow(msg)),
  error: msg => console.log(chalk.red(msg)),
};

/**
 * Termination process
 */
function end() {
  process.exit(1);
}

function getInsertCandidateFunc() {
  return async.asyncify(async (person) => {
    person.name_eng = tryGetEngName(person);
    await insertCandidate(person); //eslint-disable-line
  });
}

function getUpsertConstituencyFunc(year) {
  return async.asyncify(async (feature) => {
    await upsertConstituency(year, feature); //eslint-disable-line
  });
}

async function importData(filePath) {
  if (!fs.existsSync(filePath)) {
    log.error('File does not exists');
    return;
  }

  try {
    const rawPeople = JSON.parse(fs.readFileSync(filePath).toString());
    log.info(`Total ${rawPeople.length} people`);

    async.eachOfLimit(rawPeople, 50, getInsertCandidateFunc(), (err) => {
      if (err) {
        log.error(err);
      } else {
        log.info('Finished!');
      }
      end();
    });
  } catch (error) {
    log.error(error);
  }
}

async function upsertPolygon(year, filePath) {
  if (!fs.existsSync(filePath)) {
    log.error('File does not exists');
    return;
  }

  if ((year - 1999) % 4 !== 0) {
    log.error(`Invalid year ${year}`);
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath).toString());
    log.info(`Total ${data.features.length} region`);

    async.eachOfLimit(data.features, 50, getUpsertConstituencyFunc(year), (err) => {
      if (err) {
        log.error(err);
      } else {
        log.info('Finished!');
      }
      end();
    });
  } catch (error) {
    log.error(error);
  }
}

program
  .version('0.1.0');

/**
 * Simple mathematic calcuation
 */

program
  .command('import <directory>')
  .description('erase and import all data to db')
  .action(importAll);

// program.command('import [command]', 'import data from csv to hasura');

program.parse(process.argv);

// If no arguments we should output the help
if (!program.args.length) program.help();
