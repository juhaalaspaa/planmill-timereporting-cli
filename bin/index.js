#!/usr/bin/env node
const tasksService = require("../services/tasks");
const timeReportsService = require("../services/timeReports");

const helpers = require("../helpers/helpers");

const yargs = require("yargs");
const inquirer = require("inquirer");

// Fetch tasks
yargs.command({
  command: "fetch",
  describe: "Fetch your Planmill tasks",
  builder: {},

  handler(argv) {
    tasksService.fetchTasks();
  },
});

// Push time reports to planmill
yargs.command({
  command: "push",
  describe: "Push time reports for current date",
  builder: {},

  handler(argv) {
    timeReportsService.pushTimeReports();
  },
});

// Get todays time reports (local)
yargs.command({
    command: "t",
    describe: "Get todays time reports (local)",
    builder: {},
  
    handler(argv) {
      timeReportsService.getTodaysTimeReports();
    },
  });

// Get yesterday time reports from planmill
yargs.command({
  command: "y",
  describe: "Fetch yesterdays time reports (Planmill)",
  builder: {},

  handler(argv) {
    timeReportsService.getYesterdaysTimeReports();
  },
});

// Delete single time report
yargs.command({
  command: "del",
  describe: "Delete single time report",
  builder: {
    i: {
      describe: "Index of time report to be deleted",
      demandOption: true,
      type: "number",
    },
  },

  handler(argv) {
    timeReportsService.deleteTimeReport(argv.i);
  },
});

// Log time report
yargs.command({
  command: "log",
  describe: "Log timereport",
  builder: {
    t: {
      describe: "Task search term",
      demandOption: true,
      type: "string",
    },
  },

  handler(argv) {
    const suggestedTasks = tasksService.loadTaskSuggestionsFromFile(argv.t);

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
          description: description
        };

        timeReportsService.addTimeReport(timeReport);
      });
  },
});

yargs.parse();
