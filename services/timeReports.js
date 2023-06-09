const planmillApiClient = require("../apiclient/planmillApiClient");
const config = require("../config/default");
const helpers = require("../helpers/helpers");
const tasksService = require("../services/tasks");
const fileService = require("../services/files");

const addTimeReport = (newTimeReport) => {
  let timeReports = fileService.getCurrentDateTimeReportFileContents();

  let calculatedTimes = getStartAndFinishtimeFromPreviousTimeReport(
    newTimeReport.hours
  );
  newTimeReport.start = calculatedTimes.start;
  newTimeReport.finish = calculatedTimes.finish;
  newTimeReport.hours = newTimeReport.hours || calculatedTimes.hours;

  timeReports.push(newTimeReport);

  logTimeReportContents(timeReports);

  fileService.writeCurrentDateTimeReportContentsToFile(timeReports);
};

const pushTimeReports = () => {
  console.log("Pushing time reports...");

  let timeReports = fileService.getMostRecentExistingTimeReportFileContents();

  let timeReporsToPush = combineEqualTimeReports(timeReports);

  timeReporsToPush.forEach((tr) => {
    if (tr.taskId) {
      console.log("Pushing " + tr.description + " / " + tr.hours + " h");
      planmillApiClient.postTimeReport(tr);
    }
  });

  console.log("Push done.");
};

combineEqualTimeReports = (timeReports) => {
  let timeRepostsWithEqualCombined = [];

  timeReports.forEach((tr) => {
    if (tr.taskId) {
      let existingEqualTimeReportIndex = timeRepostsWithEqualCombined.findIndex(x => x.taskId === tr.taskId && x.description === tr.description);

      if (existingEqualTimeReportIndex > -1) {
        timeRepostsWithEqualCombined[existingEqualTimeReportIndex].hours += tr.hours;
        timeRepostsWithEqualCombined[existingEqualTimeReportIndex].finish = helpers.addMinutes(new Date(timeRepostsWithEqualCombined[existingEqualTimeReportIndex].finish), tr.hours * 60);
      }
      else {
        timeRepostsWithEqualCombined.push(tr);
      }
    }
  });

  return timeRepostsWithEqualCombined;
}

const deleteTimeReport = (index) => {
  let timeReports = fileService.getCurrentDateTimeReportFileContents();
  timeReports.splice(index, 1);

  logTimeReportContents(timeReports);

  fileService.writeCurrentDateTimeReportContentsToFile(timeReports);
};

const getStartAndFinishtimeFromPreviousTimeReport = (trHours) => {
  let timeReports = fileService.getCurrentDateTimeReportFileContents();
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
  let timeReports = fileService.getCurrentDateTimeReportFileContents();
  logTimeReportContents(timeReports);
};

const getYesterdaysTimeReports = async () => {
  let timeReports = await planmillApiClient.fetchYesterdaysTimeReports();

  let mappedTimeReports = timeReports.map((tr) => {
    return {
      taskId: tr.task,
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

module.exports = {
  addTimeReport,
  pushTimeReports,
  deleteTimeReport,
  getYesterdaysTimeReports,
  getTodaysTimeReports,
};

