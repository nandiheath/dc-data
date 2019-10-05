#!/usr/bin/env node

const program = require('commander');
const { importAll } = require('./lib/importer');
const { scrapeNominate } = require('./lib/nominate');
require('dotenv').config();

program
  .version('0.1.0');

/**
 * Simple mathematic calcuation
 */

program
  .command('import <directory>')
  .description('erase and import all data to db')
  .action(importAll);


program
  .command('nominate <csv_directory> <output_directory>')
  .description('scrape the nominate data from gov')
  .action(scrapeNominate);

// program.command('import [command]', 'import data from csv to hasura');

program.parse(process.argv);

// If no arguments we should output the help
if (!program.args.length) program.help();
