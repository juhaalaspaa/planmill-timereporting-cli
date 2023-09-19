#!/usr/bin/env node
const tasksService = require("../services/tasks");
const timeReportsService = require("../services/timeReports");

const helpers = require("../helpers/helpers");
const config = require("../config/default");
const configSchema = require("../config/schema");

const yargs = require("yargs");
const inquirer = require("inquirer");
const inquirerPrompt = require("inquirer-autocomplete-prompt");

// Config validation
const Validator = require("jsonschema").Validator;
const validator = new Validator();
validator.validate(config, configSchema, { throwFirst: true });

inquirer.registerPrompt("autocomplete", inquirerPrompt);

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
  command: "d [i]",
  describe: "Delete single time report",

  handler(argv) {
    timeReportsService.deleteTimeReport(argv.i);
  },
});

function searchTasks(_, input = "") {
  return new Promise((resolve) => {
    let lowerCaseInput = input.toLowerCase();
    let tasks = tasksService.loadTaskSuggestionsFromFile(lowerCaseInput);
    resolve(tasks);
  });
}

function searchDescriptions(taskId, input = "") {
  return new Promise((resolve) => {
    let lowerCaseInput = input.toLowerCase();
    let descriptions = timeReportsService.getPreviousDescriptionsOnTask(
      taskId,
      60
    );
    let filteredDescriptions = descriptions.filter((d) =>
      d.toLowerCase().includes(lowerCaseInput)
    );
    resolve(filteredDescriptions);
  });
}

// Log time report
yargs.command({
  command: "l",
  describe: "Log timereport",

  handler() {
    inquirer
      .prompt([
        {
          type: "autocomplete",
          name: "task",
          message: "Select task:",
          source: searchTasks,
        },
        {
          type: "number",
          name: "hours",
          message: "Hours:",
          default:
            timeReportsService.getNextTimeReportHoursFromPreviousTimeReport(),
        },
        {
          type: "string",
          name: "description",
          message: "Comment:",
          default: (answers) =>
            timeReportsService.getMostRecentDescriptionOnTask(
              answers.task.taskId,
              15
            ),
        },
        {
          type: "autocomplete",
          name: "description",
          message: "Comment:",
          suggestOnly: true,
          askAnswered: true,
          source: (answers, input) =>
            searchDescriptions(answers.task.taskId, input),
          when: (answers) => {
            return answers.description === "?";
          },
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
    let presetTaskId = config.planmill.presetTaskIds[argv.preset - 1];
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
          default:
            timeReportsService.getNextTimeReportHoursFromPreviousTimeReport(),
        },
        {
          type: "string",
          name: "description",
          message: "Comment:",
          default: timeReportsService.getMostRecentDescriptionOnTask(
            presetTask.taskId,
            15
          ),
        },
        {
          type: "autocomplete",
          name: "description",
          message: "Comment:",
          suggestOnly: true,
          askAnswered: true,
          source: (_, input) => searchDescriptions(presetTaskId, input),
          when: (answers) => {
            return answers.description === "?";
          },
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

// Log time report to most used tasks
yargs.command({
  command: "m",
  describe: "Log to most used tasks",

  handler() {
    inquirer
      .prompt([
        {
          type: "list",
          name: "task",
          message: "Select task:",
          choices: tasksService.getMostUsedTaskFromPastDays(30),
        },
        {
          type: "number",
          name: "hours",
          message: "Hours:",
          default:
            timeReportsService.getNextTimeReportHoursFromPreviousTimeReport(),
        },
        {
          type: "string",
          name: "description",
          message: "Comment:",
          default: (answers) =>
            timeReportsService.getMostRecentDescriptionOnTask(
              answers.task.taskId,
              15
            ),
        },
        {
          type: "autocomplete",
          name: "description",
          message: "Comment:",
          suggestOnly: true,
          askAnswered: true,
          source: (answers, input) =>
            searchDescriptions(answers.task.taskId, input),
          when: (answers) => {
            return answers.description === "?";
          },
        },
      ])
      .then((answers) => {
        let description = helpers.formatDescription(answers.description);

        const timeReport = {
          taskId: answers.task.taskId,
          name: answers.task.name,
          projectId: answers.task.projectId,
          hours: answers.hours,
          description: description,
        };

        timeReportsService.addTimeReport(timeReport);
      });
  },
});

// Log break with hours on time report
yargs.command({
  command: "b [hours]",
  describe:
    "Log break on timereport, first break (+ or - hours) can be used to manipulate logging start time",

  handler(argv) {
    inquirer
    .prompt([
      {
        name: "hours",
        message: "Hours:",
        default:
          timeReportsService.getNextTimeReportHoursFromPreviousTimeReport(),
        when: !argv.hours
      },
    ])
    .then((answers) => {
      const timeReport = { hours: argv.hours || answers.hours, name: "BREAK", description: "---" };
      timeReportsService.addTimeReport(timeReport);
    });
  }
});

// Log lunch break on time report
yargs.command({
  command: "lb",
  describe: "Log lunch break on timereport",

  handler() {
    const timeReport = {
      hours: config.general.defaultLunchBreakLengthInHours,
      name: "BREAK",
      description: "Lunch",
    };

    timeReportsService.addTimeReport(timeReport);
  },
});

// List preset tasks
yargs.command({
  command: "lp",
  describe: "List preset tasks",

  handler() {
    tasksService.listPresetTasks();
  },
});

yargs.parse();
