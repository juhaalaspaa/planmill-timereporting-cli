const planmillApiClient = require("../apiclient/planmillApiClient");
const config = require("../config/default");
const fileService = require("../services/files");

const fetchTasks = async () => {
  console.log("Fetching projects and tasks..");
  const { tasks, projects } = await planmillApiClient.getTasks();

  fileService.writeFile(config.filePaths.tasks, tasks);
  fileService.writeFile(config.filePaths.projects, projects);
};

const getProjectNameById = (id) => {
  let projects = fileService.readAndParseFile(config.filePaths.projects);
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
  let tasks = fileService.readAndParseFile(config.filePaths.tasks);
  let foundTask = tasks.find((x) => x.id == id);

  if (foundTask) {
    foundTask.taskId = foundTask.id;
    foundTask.projectId = foundTask.parent;    
    return foundTask;
  } else {
    return null;
  }
};

const loadTaskSuggestionsFromFile = (searchTerm) => {
  let tasks = fileService.readAndParseFile(config.filePaths.tasks);
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

const getMostRecentDescriptionOnTask = (
  taskId,
  numberOfPastDysToSearchWithin
) => {
  let foundDescription = "";
  let mostRecentTimeReportFileContents =
    fileService.getExistingTimeReportFileContentsForPastDays(
      numberOfPastDysToSearchWithin
    );

  mostRecentTimeReportFileContents.every((timeReportFileContents) => {
    filteredTimeReports = timeReportFileContents.filter(
      (tr) => tr.taskId === taskId
    );

    filteredTimeReports.sort((a, b) => {
      return a.finish == b.finish ? 0 : a.finish < b.finish ? 1 : -1;
    });

    if (filteredTimeReports.length > 0) {
      foundDescription = filteredTimeReports[0].description;
      return false;
    } else {
      return true;
    }
  });

  return foundDescription;
};

module.exports = {
  fetchTasks,
  loadTaskSuggestionsFromFile,
  getTaskNameById,
  getTaskById,
  getProjectNameById,
  getMostRecentDescriptionOnTask,
};
