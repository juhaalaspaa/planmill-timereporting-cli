#!/usr/bin/env node
const tasksService = require("../services/tasks");
const timeReportsService = require("../services/timeReports");

const helpers = require("../helpers/helpers");
const config = require("../config/default");

const yargs = require("yargs");
const inquirer = require("inquirer");

// Fetch tasks
yargs.command({
  command: "fetch",
  describe: "Fetch your Planmill tasks",

  handler() {
    tasksService.fetchTasks();
  },
});

// Push time reports to planmill
yargs.command({
  command: "push",
  describe: "Push time reports for current date",

  handler() {
    timeReportsService.pushTimeReports();
  },
});

// Get todays time reports (local)
yargs.command({
  command: "t",
  describe: "Get todays time reports (local)",

  handler() {
    timeReportsService.getTodaysTimeReports();
  },
});

// Get yesterday time reports from planmill
yargs.command({
  command: "y",
  describe: "Fetch yesterdays time reports (Planmill)",
  builder: {},

  handler() {
    timeReportsService.getYesterdaysTimeReports();
  },
});

// Delete single time report
yargs.command({
  command: "d <i>",
  describe: "Delete single time report",

  handler(argv) {
    timeReportsService.deleteTimeReport(argv.i);
  },
});

// Log time report
yargs.command({
  command: "l <taskSearchTerm..>",
  describe: "Log timereport",

  handler(argv) {
    const suggestedTasks = tasksService.loadTaskSuggestionsFromFile(
      argv.taskSearchTerm.join(" ")
    );

    inquirer
      .prompt([
        {
          type: "list",
          name: "task",
          message: "Select task:",
          choices: suggestedTasks,
        },
        {
          type: "number",
          name: "hours",
          message: "Hours:",
        },
        {
          type: "string",
          name: "description",
          message: "Comment:",
        },
      ])
      .then((answers) => {
        let chosenTask = answers.task;
        let description = helpers.formatDescription(answers.description);

        const timeReport = {
          taskId: chosenTask.taskId,
          name: chosenTask.name,
          projectId: chosenTask.projectId,
          hours: answers.hours,
          description: description,
        };

        timeReportsService.addTimeReport(timeReport);
      });
  },
});

// Log time report to a preset task
yargs.command({
  command: "p <preset>",
  describe: "Log to a preset task",

  handler(argv) {
    let presetTaskId = config.presetTaskIds[argv.preset - 1];
    let presetTask = null;

    if (!presetTaskId) {
      console.log("Preset task not found at " + argv.preset);
      return;
    } else {
      presetTask = tasksService.getTaskById(presetTaskId);

      if (!presetTask) {
        console.log("Preset task not found by id " + presetTaskId);
        return;
      }

      let presetProjectName = tasksService.getProjectNameById(
        presetTask.parent
      );
      console.log(`Logging to task ${presetTask.name} (${presetProjectName})`);
    }

    inquirer
      .prompt([
        {
          type: "number",
          name: "hours",
          message: "Hours:",
        },
        {
          type: "string",
          name: "description",
          message: "Comment:",
        },
      ])
      .then((answers) => {
        let chosenTask = presetTask;
        let description = helpers.formatDescription(answers.description);

        const timeReport = {
          taskId: chosenTask.taskId,
          name: chosenTask.name,
          projectId: chosenTask.projectId,
          hours: answers.hours,
          description: description,
        };

        timeReportsService.addTimeReport(timeReport);
      });
  },
});

// Log break on time report
yargs.command({
  command: "b",
  describe:
    "Log break on timereport, first break (+ or - hours) can be used to manipulate logging start time",

  handler(argv) {
    inquirer
      .prompt([
        {
          name: "hours",
          message: "Hours:",
        },
      ])
      .then((answers) => {
        const timeReport = {
          hours: answers.hours,
          name: "BREAK",
          description: "---",
        };

        timeReportsService.addTimeReport(timeReport);
      });
  },
});

// Log lunch break on time report
yargs.command({
  command: "lb",
  describe: "Log lunch break on timereport",

  handler() {
    const timeReport = {
      hours: config.defaultLunchBreakLengthInHours,
      name: "BREAK",
      description: "Lunch",
    };

    timeReportsService.addTimeReport(timeReport);
  },
});

yargs.parse();
