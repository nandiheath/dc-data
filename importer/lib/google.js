
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));
const cheerio = require('cheerio');
const fs = require('fs');
const csv2json = require('csvtojson');
const chalk = require('chalk');
const { Parser } = require('json2csv');
const { nameMatch } = require('./utils');
const uuid = require('uuid/v4');

const readline = require('readline');
const { google } = require('googleapis');

const MASTER_DATA_SHEET_ID = '1yjBrzEy7MV3HdVug27zgmb-B8FYyomWp-84uDVTPNzI';

// default logger
const log = {
  debug: msg => console.log(chalk.cyan(msg)),
  info: msg => console.log(chalk.yellow(msg)),
  error: msg => console.log(chalk.red(msg)),
};


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(null, oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(null, oAuth2Client);
    });
  });
}

async function uploadNominatedCandidates(auth, candidates) {
  const sheets = google.sheets({ version: 'v4', auth });
  const values = candidates.map((c) => {
    const id = parseInt(c.id, 10);
    const rowId = id + 1;
    return [
      id,
      c.name_zh, c.name_en, c.election_type,
      c.person_id, // since the english name is not here. we use only the chinese name for matching
      // `=INDEX(dcd_people!$A$2:$C$7236,MATCH(concatenate(B${rowId},C${rowId}),dcd_people!$C$2:C&dcd_people!$B$2:B,0),1)`
      `=COUNTIF(dcd_people!$C$2:$C$7236, B${rowId})`,
      2019,
      c.cacode,
      `=index(dcd_constituencies!A$2:D, match(concatenate(2019,H${rowId}),dcd_constituencies!$D$2:D&dcd_constituencies!$B$2:B) , 1)`,
      null,
      c.political_affiliation,
      c.camp, // skip overwrite camp
      null,
      c.occupation,
      c.nominated_at,
      c.nominate_status,
    ];
  });
  const data = [{
    range: 'dcd_candidates!A4407:V',
    values,
  }];
  // Additional ranges to update ...
  const resource = {
    data,
    valueInputOption: 'USER_ENTERED',
  };
  sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: '1yjBrzEy7MV3HdVug27zgmb-B8FYyomWp-84uDVTPNzI',
    resource,
  }, (err, result) => {
    if (err) {
      log.error(`cannot update spreadsheet. error: ${JSON.stringify(err)}`);
      return;
    }

    log.info(`total ${result.data.totalUpdatedCells} cells updated.`);
  });
}

async function uploadNominatedPeople(auth, people) {
  const sheets = google.sheets({ version: 'v4', auth });
  const values = people.map((p) => {
    const id = parseInt(p.id, 10);
    return [
      id,
      p.name_en,
      p.name_zh,
      p.estimated_yob,
      p.gender,
      p.related_organization,
      p.uuid,
      p.fc_uuid,
    ];
  });
  const data = [{
    range: 'dcd_people!A2442:V',
    values,
  }];
  // Additional ranges to update ...
  const resource = {
    data,
    valueInputOption: 'USER_ENTERED',
  };
  sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: '1yjBrzEy7MV3HdVug27zgmb-B8FYyomWp-84uDVTPNzI',
    resource,
  }, (err, result) => {
    if (err) {
      log.error(`cannot update spreadsheet. error: ${JSON.stringify(err)}`);
      return;
    }

    log.info(`total ${result.data.totalUpdatedCells} cells updated.`);
  });
}

const downloadMappings = async (auth) => {
  const sheets = google.sheets({ version: 'v4', auth });
  const req = {
    // The spreadsheet to request.
    spreadsheetId: '1MopNfvXzfoF57ipWyzmS0JkFZu63lhLLztfYdcIiTKo',

    // The ranges to retrieve from the spreadsheet.
    range: 'dc2019_candidates_camp!A2:K',
    auth,
  };

  const ss = Promise.promisifyAll(sheets.spreadsheets.values);
  const data = await ss.getAsync(req);
  const mappings = data.data.values.map(r => ({
    name: r[0],
    cacode: r[6],
    camp: r[10],
  }));
  return mappings;
};

const loadPeople = async () => {
  let content;
  try {
    content = fs.readFileSync('credentials.json').toString();
    content = JSON.parse(content);
  } catch (error) {
    log.error('cannot load the credential file. please download it from https://developers.google.com/sheets/api/quickstart/nodejs');
    return null;
  }
  try {
    const authAsync = Promise.promisify(authorize);
    const auth = await authAsync(content);
    const sheets = google.sheets({ version: 'v4', auth });
    const req = {
      // The spreadsheet to request.
      spreadsheetId: MASTER_DATA_SHEET_ID,

      // The ranges to retrieve from the spreadsheet.
      range: 'dcd_people!A1:K',
      auth,
    };

    const ss = Promise.promisifyAll(sheets.spreadsheets.values);
    const data = await ss.getAsync(req);
    return data.data.values;
  } catch (error) {
    log.error('error when uploading data to google spreadsheet');
    console.error(error);
    log.error(JSON.stringify(error));
  }
  return null;
};

const loadCandidates = async (fromId, toId) => {
  let content;
  try {
    content = fs.readFileSync('credentials.json').toString();
    content = JSON.parse(content);
  } catch (error) {
    log.error('cannot load the credential file. please download it from https://developers.google.com/sheets/api/quickstart/nodejs');
    return [];
  }
  try {
    const authAsync = Promise.promisify(authorize);
    const auth = await authAsync(content);
    const sheets = google.sheets({ version: 'v4', auth });
    const req = {
      // The spreadsheet to request.
      spreadsheetId: MASTER_DATA_SHEET_ID,

      // The ranges to retrieve from the spreadsheet.
      range: `dcd_candidates!A${fromId + 1}:U${toId + 1}`,
      auth,
    };

    const ss = Promise.promisifyAll(sheets.spreadsheets.values);
    const data = await ss.getAsync(req);
    return data.data.values;
  } catch (error) {
    log.error('error when uploading data to google spreadsheet');
    console.error(error);
    log.error(JSON.stringify(error));
  }
  return [];
};

const loadPeopleCampMapping = async () => {
  let mappings = [];

  let content;
  try {
    content = fs.readFileSync('credentials.json').toString();
    content = JSON.parse(content);
  } catch (error) {
    log.error('cannot load the credential file. please download it from https://developers.google.com/sheets/api/quickstart/nodejs');
    return mappings;
  }
  try {
    const authAsync = Promise.promisify(authorize);
    const auth = await authAsync(content);
    mappings = await downloadMappings(auth);
  } catch (error) {
    log.error('error when uploading data to google spreadsheet');
    console.error(error);
    log.error(JSON.stringify(error));
  }
  return mappings;
}

const uploadIntermediate = async (directory) => {
  let content;
  try {
    content = fs.readFileSync('credentials.json').toString();
    content = JSON.parse(content);
  } catch (error) {
    log.error('cannot load the credential file. please download it from https://developers.google.com/sheets/api/quickstart/nodejs');
    return;
  }

  try {
    const authAsync = Promise.promisify(authorize);
    const auth = await authAsync(content);
    const candidates = await csv2json().fromFile(`${directory}/nominated_candidates.csv`);
    const people = await csv2json().fromFile(`${directory}/nominated_people.csv`);
    await uploadNominatedCandidates(auth, candidates);
    await uploadNominatedPeople(auth, people);
  } catch (error) {
    log.error('error when uploading data to google spreadsheet');
    console.error(error);
    log.error(JSON.stringify(error));
  }
}

module.exports = {
  uploadIntermediate,
  loadCandidates,
  loadPeople,
  loadPeopleCampMapping,
};
