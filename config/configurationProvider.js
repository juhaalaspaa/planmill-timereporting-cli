let config;
let configLocal;
let additionalTasks;
let additionalTasksLocal;

// TODO: Implement more sophisticated configuration provider

try {
  config = require("./default");
} catch (e) {
}

try {
  configLocal = require("./default.local");
} catch (e) {
}

try {
  additionalTasks = require("./additionalTasks");
} catch (e) {
}

try {
  additionalTasksLocal = require("./additionalTasks.local");
} catch (e) {
}

const getConfig = () => configLocal || config;
const getAdditionalTasks = () => additionalTasksLocal || additionalTasks;

module.exports = {
  getConfig,
  getAdditionalTasks,
};