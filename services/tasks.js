const fs = require("fs");
const planmillApiClient = require("../apiclient/planmillApiClient");
const config = require("../config/default");

const fetchTasks = async () => {
  console.log("Fetching projects and tasks..");
  const { tasks, projects } = await planmillApiClient.getTasks();

  fs.writeFile(
    config.filePaths.tasks,
    JSON.stringify(tasks),
    { flag: "w" },
    (err) => {
      if (err) {
        console.error(err);
      }
      // file written successfully
    }
  );

  fs.writeFile(
    config.filePaths.projects,
    JSON.stringify(projects),
    { flag: "w" },
    (err) => {
      if (err) {
        console.error(err);
      }
      // file written successfully
    }
  );
};

const getProjectNameById = (id) => {
  let projectsRawData = fs.readFileSync(config.filePaths.projects);
  let projects = JSON.parse(projectsRawData);
  let foundProject = projects.find(x => x.id == id);
  
  if(foundProject) {
    return foundProject.name;
  }
  else {
    return id;
  }
}

const getTaskNameById = (id) => {
  let tasksRawData = fs.readFileSync(config.filePaths.tasks);
  let tasks = JSON.parse(tasksRawData);
  let foundTask = tasks.find(x => x.id == id);
  
  if(foundTask) {
    return foundTask.name;
  }
  else {
    return id;
  }
}

const loadTaskSuggestionsFromFile = (searchTerm) => {
  let rawTaskData = fs.readFileSync(config.filePaths.tasks);
  let tasks = JSON.parse(rawTaskData);
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

module.exports = {
  fetchTasks,
  loadTaskSuggestionsFromFile,
  getTaskNameById
};
