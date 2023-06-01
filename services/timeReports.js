const fs = require("fs");
const planmillApiClient = require("../apiclient/planmillApiClient");
const config = require("../config/default");
const helpers = require("../helpers/helpers");
const tasksService = require("../services/tasks");

const addTimeReport = (newTimeReport) => {
  let timeReports = getCurrentDateTimeReportFileContents();

  let calculatedTimes = getStartAndFinishtimeFromPreviousTimeReport(
    newTimeReport.hours
  );
  newTimeReport.start = calculatedTimes.start;
  newTimeReport.finish = calculatedTimes.finish;
  newTimeReport.hours = newTimeReport.hours || calculatedTimes.hours;

  timeReports.push(newTimeReport);

  logTimeReportContents(timeReports);

  writeCurrentDateTimeReportContentsToFile(timeReports);
};

const pushTimeReports = () => {
  console.log("Pushing time reports...");

  let currentDate = new Date();
  const currentDateString = currentDate.toISOString().split("T")[0];
  let currentDateTimeReportsFileName = `${config.filePaths.timeReportsFolder}\\${currentDateString}.json`;

  let timeReportRawData = fs.readFileSync(currentDateTimeReportsFileName);
  let timeReports = JSON.parse(timeReportRawData);

  timeReports.forEach((tr) => {
    console.log("Pushing " + tr.description);
    if (tr.taskId) {
      planmillApiClient.postTimeReport(tr);
    }
  });

  console.log("Push done.");
};

const deleteTimeReport = (index) => {
  let timeReports = getCurrentDateTimeReportFileContents();
  timeReports.splice(index, 1);

  logTimeReportContents(timeReports);

  writeCurrentDateTimeReportContentsToFile(timeReports);
};

const getStartAndFinishtimeFromPreviousTimeReport = (trHours) => {
  let timeReports = getCurrentDateTimeReportFileContents();
  let start;
  let finish;

  if (timeReports.length == 0) {
    start = new Date();
    start.setHours(config.workStartHour24clock);
    start.setMinutes(0);
    start.setSeconds(0);
  } else {
    let lastTimeReport = timeReports[timeReports.length - 1];

    if (lastTimeReport.finish) {
      start = new Date(lastTimeReport.finish);
    } else {
      let totalHours = 0;
      timeReports.forEach((timeReport) => {
        totalHours += timeReport.hours;
      });

      let decimalTime = totalHours * 60 * 60;
      let reportedHours = Math.floor(decimalTime / (60 * 60));
      decimalTime = decimalTime - reportedHours * 60 * 60;
      let reportedMinutes = Math.floor(decimalTime / 60);

      start = new Date();

      start.setHours(config.workStartHour24clock + reportedHours);
      start.setMinutes(reportedMinutes);
    }
  }

  if (trHours) {
    let millisecondsToAdd = trHours * 3600000;
    finish = new Date(new Date(start).getTime() + millisecondsToAdd);
  } else {
    finish = helpers.roundTimeQuarterHour(new Date());
  }

  let hours = helpers.getDifferenceInMinutes(start, finish) / 60;

  return { start, finish, hours };
};

const getTodaysTimeReports = () => {
  let timeReports = getCurrentDateTimeReportFileContents();
  logTimeReportContents(timeReports);
};

const getYesterdaysTimeReports = async () => {
  let timeReports = await planmillApiClient.fetchYesterdaysTimeReports();

  let mappedTimeReports = timeReports.map((tr) => {
    return {
      start: tr.start,
      projectId: tr.project,
      hours: tr.amount / 60,
      description: tr.comment,
      name: tasksService.getTaskNameById(tr.task),
    };
  });

  mappedTimeReports.sort((a, b) => {
    return a.hours == b.hours ? 0 : a.hours < b.hours ? 1 : -1;
  });

  logTimeReportContents(mappedTimeReports);
};

const getCurrentDateFilename = () => {
  let currentDate = new Date();
  const currentDateString = currentDate.toISOString().split("T")[0];
  let currentDateTimeReportsFileName = `${config.filePaths.timeReportsFolder}\\${currentDateString}.json`;
  return currentDateTimeReportsFileName;
};

const getCurrentDateTimeReportFileContents = () => {
  let currentDateTimeReportsFileName = getCurrentDateFilename();

  let timeReports = [];

  try {
    let timeReportRawData = fs.readFileSync(currentDateTimeReportsFileName);
    timeReports = JSON.parse(timeReportRawData);
  } catch (e) {}
  return timeReports;
};

const logTimeReportContents = (timeReports) => {
  let output = "\r\n";
  let totalHours = 0;

  timeReports.forEach((timeReport, key) => {
    let timeReportString = `${key} | ${timeReport.name || "-"} | ${timeReport.description} | ${timeReport.hours}h\r\n`;
    output = output + timeReportString;

    if (timeReport.taskId) {
      totalHours += timeReport.hours;
    }
  });

  output = output + "\r\nTotal hours: " + totalHours + " h\r\n";

  console.log(output);
};

const writeCurrentDateTimeReportContentsToFile = (timeReports) => {
  let currentDateTimeReportsFileName = getCurrentDateFilename();

  fs.writeFile(
    currentDateTimeReportsFileName,
    JSON.stringify(timeReports),
    { flag: "w" },
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
};

module.exports = {
  addTimeReport,
  pushTimeReports,
  deleteTimeReport,
  getYesterdaysTimeReports,
  getTodaysTimeReports,
};
