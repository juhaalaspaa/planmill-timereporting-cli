const planmillApiClient = require("../apiclient/planmillApiClient");
const config = require("../config/default");
const helpers = require("../helpers/helpers");
const tasksService = require("../services/tasks");
const fileService = require("../services/files");

const numberOfPastDysToSearchWithin = 14;

const addTimeReport = (newTimeReport) => {
  let timeReports = fileService.getCurrentDateTimeReportFileContents();

  let calculatedTimes = getStartAndFinishtimeFromPreviousTimeReport(
    newTimeReport.hours
  );
  newTimeReport.start = calculatedTimes.start;
  newTimeReport.finish = calculatedTimes.finish;
  newTimeReport.hours = newTimeReport.hours || calculatedTimes.hours;

  if (!newTimeReport.description) {
    let mostRecentDescriptionForTask =
      tasksService.getMostRecentDescriptionOnTask(
        newTimeReport.taskId,
        numberOfPastDysToSearchWithin
      );
    if (!mostRecentDescriptionForTask) {
      console.log(
        `Could not find any previous description for task ${newTimeReport.taskId} within ${numberOfPastDysToSearchWithin} days. Aborting...`
      );
      return;
    }

    newTimeReport.description = mostRecentDescriptionForTask;
  }

  timeReports.push(newTimeReport);

  fileService.writeCurrentDateTimeReportContentsToFile(timeReports);

  logTimeReportContents(timeReports);
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
      let existingEqualTimeReportIndex = timeRepostsWithEqualCombined.findIndex(
        (x) => x.taskId === tr.taskId && x.description === tr.description
      );

      if (existingEqualTimeReportIndex > -1) {
        timeRepostsWithEqualCombined[existingEqualTimeReportIndex].hours +=
          tr.hours;
        timeRepostsWithEqualCombined[existingEqualTimeReportIndex].finish =
          helpers.addMinutes(
            new Date(
              timeRepostsWithEqualCombined[existingEqualTimeReportIndex].finish
            ),
            tr.hours * 60
          );
      } else {
        timeRepostsWithEqualCombined.push(tr);
      }
    }
  });

  return timeRepostsWithEqualCombined;
};

const deleteTimeReport = (index) => {
  let timeReports = fileService.getCurrentDateTimeReportFileContents();

  if (!index) {
    index = timeReports.length - 1;
  }
  
  timeReports.splice(index, 1);

  fileService.writeCurrentDateTimeReportContentsToFile(timeReports);

  logTimeReportContents(timeReports);
};

const getStartAndFinishtimeFromPreviousTimeReport = (trHours, timeReports) => {
  if (!timeReports) {
    timeReports = fileService.getCurrentDateTimeReportFileContents();
  }
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

  logTimeReportContents(mappedTimeReports, false);
};

const logTimeReportContents = (timeReports, logUnloggedTime = true) => {
  let output = "\r\n";
  let totalHours = 0;

  timeReports.forEach((timeReport, key) => {
    output += getTimeReportLogRow(timeReport, key);

    if (timeReport.taskId) {
      totalHours += timeReport.hours;
    }
  });

  if (logUnloggedTime) {
    let unlogged = getStartAndFinishtimeFromPreviousTimeReport(
      null,
      timeReports
    );

    if (unlogged.hours > 0) {
      let unloggedTimeRow = {
        name: "NOT YET LOGGED",
        description: "???",
        hours: unlogged.hours,
      };

      output += getTimeReportLogRow(unloggedTimeRow, "*");
    }
  }

  output = output + "\r\nTotal hours: " + totalHours + " h\r\n";

  console.log(output);
};

const getTimeReportLogRow = (timeReport, key) => {
  return `${key} | ${timeReport.name || "-"} | ${timeReport.description} | ${
    timeReport.hours
  }h\r\n`;
};

module.exports = {
  addTimeReport,
  pushTimeReports,
  deleteTimeReport,
  getYesterdaysTimeReports,
  getTodaysTimeReports,
};
