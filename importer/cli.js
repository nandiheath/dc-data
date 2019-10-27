#!/usr/bin/env node

const program = require('commander');
const { importAll, updateCandidate } = require('./lib/importer');
const { scrapeNominate } = require('./lib/nominate');
const { uploadIntermediate } = require('./lib/google');
require('dotenv').config();

program
  .version('0.1.0');

async function importNominateData(csvDirectory, intermediateDirectory, cmd) {

  await scrapeNominate(csvDirectory, intermediateDirectory);
  if (cmd.upload) {
    await uploadIntermediate(intermediateDirectory);
  }
}

program
  .command('import <directory>')
  .description('erase and import all data to db')
  .action(importAll);

program
  .command('update <fromId> <toId>')
  .description('update the candidate from master data sheet and import to hasura directly')
  .action(updateCandidate);

program
  .command('nominate <csv_directory> <intermediate_directory>')
  .description('scrape the nominate data from gov and upload to master sheet')
  .option('-u, --upload', 'uploda the data to master data sheet')
  .action(importNominateData);

// program.command('import [command]', 'import data from csv to hasura');

program.parse(process.argv);

// If no arguments we should output the help
if (!program.args.length) program.help();
