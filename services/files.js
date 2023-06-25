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

const getMostRecentExistingTimeReportFileContents = () => {
  let mostRecentDateFilename = getMostRecentExistingDateFilename();
  
  if(mostRecentDateFilename) {
    return readAndParseFile(mostRecentDateFilename);
  }
  else {
    return [];
  }
}

const getCurrentDateFilename = () => {
  let currentDate = new Date();
  const currentDateString = currentDate.toISOString().split("T")[0];
  let currentDateTimeReportsFileName = `${config.filePaths.timeReportsFolder}\\${currentDateString}.json`;
  return currentDateTimeReportsFileName;
};

const getMostRecentExistingDateFilename = () => {
    let tryCount = 0;
    let maxTryCount = 5;

    while(tryCount <= maxTryCount) {
        let currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - tryCount);
        const currentDateString = currentDate.toISOString().split("T")[0];
        let currentDateTimeReportsFileName = `${config.filePaths.timeReportsFolder}\\${currentDateString}.json`;
        
        if(fs.existsSync(currentDateTimeReportsFileName)) {
            return currentDateTimeReportsFileName;
        }

        tryCount++;
    }

    return null;
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
  getMostRecentExistingTimeReportFileContents
};
