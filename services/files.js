const fs = require("fs");
const configProvider = require("../config/configurationProvider");

const TODAYS_GCAL_EVENTS_FILENAME = `${configProvider.getConfig().filePaths.baseFolder}\\todaysGCalEvents.json`;

const writeCurrentDateTimeReportContentsToFile = (timeReports) => {
  let currentDateTimeReportsFileName = getCurrentDateFilename();
  writeFile(currentDateTimeReportsFileName, timeReports);
};

const getCurrentDateTimeReportFileContents = () => {
  let currentDateTimeReportsFileName = getCurrentDateFilename();
  return readAndParseFile(currentDateTimeReportsFileName);
};

const getMostRecentExistingTimeReportFileContents = () => {
  let mostRecentDateFilename = getMostRecentExistingDateFilename();

  if (mostRecentDateFilename) {
    return readAndParseFile(mostRecentDateFilename);
  } else {
    return [];
  }
};

const getExistingTimeReportFileContentsForPastDays = (pastDays) => {
  let filenames = getExistingTimeReportFilenamesForPastDays(pastDays);
  let fileContents = [];

  filenames.forEach((filename) => {
    let content = readAndParseFile(filename);
    fileContents.push(content);
  });

  return fileContents;
};

const writeTodaysEventsToFile = (events) => {
  writeFile(TODAYS_GCAL_EVENTS_FILENAME, events);
};

const getTodaysEventsFileContents = () => {
  return readAndParseFile(TODAYS_GCAL_EVENTS_FILENAME);
};

const getCurrentDateFilename = () => {
  let currentDate = new Date();
  const currentDateString = currentDate.toISOString().split("T")[0];
  let currentDateTimeReportsFileName = `${configProvider.getConfig().filePaths.timeReportsFolder}\\${currentDateString}.json`;
  return currentDateTimeReportsFileName;
};

const getMostRecentExistingDateFilename = () => {
  let tryCount = 0;
  let maxTryCount = 5;

  while (tryCount <= maxTryCount) {
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - tryCount);
    const currentDateString = currentDate.toISOString().split("T")[0];
    let currentDateTimeReportsFileName = `${configProvider.getConfig().filePaths.timeReportsFolder}\\${currentDateString}.json`;

    if (fs.existsSync(currentDateTimeReportsFileName)) {
      return currentDateTimeReportsFileName;
    }

    tryCount++;
  }

  return null;
};

const getExistingTimeReportFilenamesForPastDays = (pastDays) => {
  let dayCount = 0;
  let filenames = [];

  while (dayCount < pastDays) {
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - dayCount);
    const currentDateString = currentDate.toISOString().split("T")[0];
    let currentDateTimeReportsFileName = `${configProvider.getConfig().filePaths.timeReportsFolder}\\${currentDateString}.json`;

    if (fs.existsSync(currentDateTimeReportsFileName)) {
      filenames.push(currentDateTimeReportsFileName);
    }

    dayCount++;
  }

  return filenames;
};

const writeFile = (fileName, contents) => {
  fs.writeFile(fileName, JSON.stringify(contents), { flag: "w" }, (err) => {
    if (err) {
      console.error(err);
    }
  });
};

const readAndParseFile = (fileName) => {
  let contents = [];

  try {
    let contentString = fs.readFileSync(fileName);
    contents = JSON.parse(contentString);
  } catch (e) {}

  return contents;
};

module.exports = {
  writeFile,
  readAndParseFile,
  writeCurrentDateTimeReportContentsToFile,
  getCurrentDateTimeReportFileContents,
  getMostRecentExistingTimeReportFileContents,
  getExistingTimeReportFileContentsForPastDays,
  writeTodaysEventsToFile,
  getTodaysEventsFileContents
};
