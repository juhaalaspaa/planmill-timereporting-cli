const planmillApiClient = require("../apiclient/planmillApiClient");
const configProvider = require("../config/configurationProvider");
const fileService = require("../services/files");
const additionalTasksSchema = require("../config/additionalTasksSchema");

const fetchTasks = async () => {
  // Validate addiotional tasks config
  const Validator = require("jsonschema").Validator;
  const validator = new Validator();
  validator.validate(configProvider.getAdditionalTasks(), additionalTasksSchema, { throwFirst: true });

  console.log("Fetching projects and tasks..");
  const { tasks, projects } = await planmillApiClient.getTasks();

  // Add additional tasks to the list
  const combinedTasks = tasks.concat(configProvider.getAdditionalTasks());
  
  fileService.writeFile(configProvider.getConfig().filePaths.tasks, combinedTasks);
  fileService.writeFile(configProvider.getConfig().filePaths.projects, projects);
};

const getProjectNameById = (id) => {
  let projects = fileService.readAndParseFile(configProvider.getConfig().filePaths.projects);
  let foundProject = projects.find((x) => x.id == id);

  if (foundProject) {
    return foundProject.name;
  } else {
    return id;
  }
};

const getTaskNameById = (id) => {
  let foundTask = getTaskById(id);

  if (foundTask) {
    return foundTask.name;
  } else {
    return id;
  }
};

const getTaskById = (id) => {
  let tasks = fileService.readAndParseFile(configProvider.getConfig().filePaths.tasks);
  let foundTask = tasks.find((x) => x.id == id);

  if (foundTask) {
    foundTask.taskId = foundTask.id;
    foundTask.projectId = foundTask.parent;
    return foundTask;
  } else {
    return null;
  }
};

const getTasksByIds = (ids) => {
  let tasks = fileService.readAndParseFile(configProvider.getConfig().filePaths.tasks);
  let foundTasks = tasks.filter((x) => ids.some((id) => x.id == id));

  foundTasks.forEach((task) => {
    task.taskId = task.id;
    task.projectId = task.parent;
    task.projectName = getProjectNameById(task.parent);
  });

  return foundTasks;
};

const loadTaskSuggestionsFromFile = (searchTerm) => {
  let tasks = fileService.readAndParseFile(configProvider.getConfig().filePaths.tasks);
  let lowercaseSearchTerm = searchTerm.toLowerCase();
  let filteredTasks = tasks.filter(
    (task) =>
      typeof task.name === "string" &&
      task.name.toLowerCase().includes(lowercaseSearchTerm)
  );
  return filteredTasks.map((task) => {
    return {
      name: `${task.name} (${getProjectNameById(task.parent)})`,
      value: { taskId: task.id, projectId: task.parent, name: task.name },
    };
  });
};

const listPresetTasks = () => {
  console.log();

  const tasks = getTasksByIds(configProvider.getConfig().planmill.presetTaskIds);
  configProvider.getConfig().planmill.presetTaskIds.forEach((presetTaskId, key) => {
    let task = tasks.find((x) => x.id == presetTaskId);
    if (task) {
      console.log(`${key + 1}: ${task.name} (${task.projectName})`);
    } else {
      console.log(`${key + 1}: PRESET TASK NOT FOUND`);
    }
  });

  console.log();
};

const getMostUsedTaskFromPastDays = (numberOfPastDysToSearchWithin) => {
  let mostRecentTimeReportFileContents =
    fileService.getExistingTimeReportFileContentsForPastDays(
      numberOfPastDysToSearchWithin
    );

  let foundTasks = [];

  mostRecentTimeReportFileContents.forEach((timeReportFileContents) => {
    timeReportFileContents.forEach((timeReport) => {
      if (timeReport.taskId) {
        let foundIndex = foundTasks.findIndex(
          (x) => x.taskId == timeReport.taskId
        );
        if (foundIndex > -1) {
          let foundTask = foundTasks[foundIndex];
          foundTask.count++;
        } else {
          foundTasks.push({
            taskId: timeReport.taskId,
            name: timeReport.name,
            projectName: getProjectNameById(timeReport.projectId),
            parent: timeReport.projectId,
            count: 1,
          });
        }
      }
    });
  });

  foundTasks = foundTasks.filter(
    (x) => !configProvider.getConfig().planmill.projectIdsNotToFetch.includes(x.parent)
  );

  foundTasks.sort((a, b) => {
    return a.count == b.count ? 0 : a.count < b.count ? 1 : -1;
  });

  return foundTasks.map((task) => {
    return {
      name: `${task.name} (${task.projectName})`,
      value: { taskId: task.taskId, projectId: task.parent, name: task.name },
    };
  });
};

module.exports = {
  fetchTasks,
  loadTaskSuggestionsFromFile,
  getTaskNameById,
  getTaskById,
  getProjectNameById,
  listPresetTasks,
  getMostUsedTaskFromPastDays,
};
