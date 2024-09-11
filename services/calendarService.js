const googleApiClient = require("../apiclient/googleApiClient");
const fileService = require("../services/files");
const helpers = require("../helpers/helpers");
const configProvider = require("../config/configurationProvider");

const listTodaysAgenda = async () => {
  const events = await googleApiClient.getTodaysEvents();

  let filteredEvents = helpers.filterIgnoredGCalEvents(events, configProvider.getConfig().calendar.ignoreEventsMatching);
  filteredEvents = helpers.filterGCalEventsWithoutStartDateTime(filteredEvents);

  const dateNormalizedEvents = helpers.setGCalEventDatesToToday(filteredEvents);
  const sortedEvents = helpers.sortGCalEvents(dateNormalizedEvents);

  const distinctEvents = []; 

  sortedEvents.forEach((event) => {
    if (!distinctEvents.find(x => x.summary === event.summary)) {
      distinctEvents.push(event);
    };
  });

  console.log("Todays agenda:");
  console.log();
  
  var eventsLenght = 0;
  distinctEvents.forEach((event) => {
    eventsLenght += helpers.getRoundedGCalEventLength(event);

    startTime = new Date(event.start.dateTime).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    endTime = new Date(event.end.dateTime).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });

    console.log(`${startTime} - ${endTime} | ${event.summary}`);
  });

  const focusTimeLenght = 7.5 - eventsLenght;

  console.log();
  console.log(`Appointed: ${eventsLenght} h`);
  console.log(`Non-appointed: ${focusTimeLenght} h`);
  console.log();
};

const getTodaysEventsDescriptions = async (useFileCache = false) => {
  let events = [];

  if (useFileCache) {
    events = fileService.getTodaysEventsFileContents();
  } else {
    events = await googleApiClient.getTodaysPastEvents();
    fileService.writeTodaysEventsToFile(events);
  }
  
  let filteredEvents = helpers.filterIgnoredGCalEvents(events, configProvider.getConfig().calendar.ignoreEventsMatching);
  filteredEvents = helpers.filterGCalEventsWithoutStartDateTime(filteredEvents);
  
  const dateNormalizedEvents = helpers.setGCalEventDatesToToday(filteredEvents);
  const sortedEvents = helpers.sortGCalEvents(dateNormalizedEvents).reverse();

  // TODO: configure events names that should be ignored 
  const distinctDescriptions = []; 

  sortedEvents.forEach((event) => {
    if (!distinctDescriptions.includes(event.summary)) {
      distinctDescriptions.push(event.summary);
    };
  });

  return distinctDescriptions;
};

const getEventLenghtByName = (eventName) => {
  const events = fileService.getTodaysEventsFileContents();
  const foundEvent = events.find((event) => event.summary === eventName);

  return helpers.getRoundedGCalEventLength(foundEvent);
}

module.exports = {
  listTodaysAgenda,
  getTodaysEventsDescriptions,
  getEventLenghtByName
};
