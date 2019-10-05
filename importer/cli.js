#!/usr/bin/env node

const program = require('commander');
const { importAll } = require('./lib/importer');
const { scrapeNominate } = require('./lib/nominate');
const { uploadIntermediate } = require('./lib/google');
require('dotenv').config();

program
  .version('0.1.0');

async function importNominateData(csvDirectory, intermediateDirectory) {
  await scrapeNominate(csvDirectory, intermediateDirectory);
  await uploadIntermediate(intermediateDirectory);
}

program
  .command('import <directory>')
  .description('erase and import all data to db')
  .action(importAll);


program
  .command('nominate <csv_directory> <intermediate_directory>')
  .description('scrape the nominate data from gov and upload to master sheet')
  .action(importNominateData);

// program.command('import [command]', 'import data from csv to hasura');

program.parse(process.argv);

// If no arguments we should output the help
if (!program.args.length) program.help();
