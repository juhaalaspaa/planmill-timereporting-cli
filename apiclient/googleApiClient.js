// Based on https://developers.google.com/calendar/api/quickstart/nodejs

const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const helpers = require("../helpers/helpers");
const configProvider = require("../config/configurationProvider");

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// The file gcalToken.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = `${configProvider.getConfig().filePaths.baseFolder}\\gcalToken.json`;
const CREDENTIALS_PATH = path.join(process.cwd(), 'config/credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists todays events
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function requestTodaysEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: helpers.getStartOfDay().toISOString(),
    timeMax: helpers.getEndOfDay().toISOString(),
  });
  const events = res.data.items;
  if (!events || events.length === 0) {
    console.log('No events found.');
    return [];
  }

  return events;
}

/**
 * Lists todays started events
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function requestTodaysPastEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: helpers.getStartOfDay().toISOString(),
    timeMax: new Date().toISOString()
  });
  const events = res.data.items;
  if (!events || events.length === 0) {
    console.log('No events found.');
    return [];
  }

  return events;
}

const getTodaysEvents = async () => {
  return await authorize()
    .then(requestTodaysEvents)
    .catch(console.error);
};

const getTodaysPastEvents = async () => {
  return await authorize()
    .then(requestTodaysPastEvents)
    .catch(console.error);
};


module.exports = { getTodaysEvents, getTodaysPastEvents };
