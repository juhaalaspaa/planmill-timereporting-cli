const googleApiClient = require("../apiclient/googleApiClient");
const fileService = require("../services/files");
const helpers = require("../helpers/helpers");

const getTodaysEventsDescriptions = async (useFileCache = false) => {
  let events = [];

  if (useFileCache) {
    events = fileService.getTodaysEventsFileContents();
  } else {
    events = await googleApiClient.getTodaysPastEvents();
    fileService.writeTodaysEventsToFile(events);
  }

  const sortedEvents = helpers.sortGCalEventsByRecentStart(events);

  return sortedEvents.map((event, i) => {
    return event.summary;
  });
};

const getEventLenghtByName = (eventName) => {
  const events = fileService.getTodaysEventsFileContents();
  const foundEvent = events.find((event) => event.summary === eventName);

  return helpers.getRoundedGCalEventLength(foundEvent);
}

module.exports = {
  getTodaysEventsDescriptions,
  getEventLenghtByName
};
