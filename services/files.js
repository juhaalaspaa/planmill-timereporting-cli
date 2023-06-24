const fs = require("fs");
const config = require("../config/default");

const writeCurrentDateTimeReportContentsToFile = (timeReports) => {
  let currentDateTimeReportsFileName = getCurrentDateFilename();
  writeFile(currentDateTimeReportsFileName, timeReports);
};

const getCurrentDateTimeReportFileContents = () => {
  let currentDateTimeReportsFileName = getCurrentDateFilename();
  return readAndParseFile(currentDateTimeReportsFileName);
};

const getCurrentDateFilename = () => {
  let currentDate = new Date();
  const currentDateString = currentDate.toISOString().split("T")[0];
  let currentDateTimeReportsFileName = `${config.filePaths.timeReportsFolder}\\${currentDateString}.json`;
  return currentDateTimeReportsFileName;
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
};
