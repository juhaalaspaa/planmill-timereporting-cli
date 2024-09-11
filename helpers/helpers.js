const formatDescription = (desc) => {
  desc = desc.replace("Feature ", "#");
  desc = desc.replace("Product Backlog Item ", "#");
  desc = desc.replace("Task ", "#");
  desc = desc.replace("Bug ", "#");

  return desc;
};

const roundTimeQuarterHour = (time) => {
  let timeToReturn = new Date(time);

  timeToReturn.setMilliseconds(
    Math.round(timeToReturn.getMilliseconds() / 1000) * 1000
  );
  timeToReturn.setSeconds(Math.round(timeToReturn.getSeconds() / 60) * 60);
  timeToReturn.setMinutes(Math.round(timeToReturn.getMinutes() / 15) * 15);
  return timeToReturn;
};

const getDifferenceInMinutes = (startTime, endTime) => {
  let difference = endTime.getTime() - startTime.getTime();
  return Math.round(difference / 60000);
};

const addMinutes = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

const getStartOfDay = () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0); // Set to 00:00:00.000

  return startOfDay;
};

const getEndOfDay = () => {
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999); // Set to 23:59:59.999

  return endOfDay;
};

const filterIgnoredGCalEvents = (events, ignoredEventNames) => events.filter(x => ignoredEventNames.every(ignoredEvent => !x.summary?.includes(ignoredEvent)));

const filterGCalEventsWithoutStartDateTime = (events) => events.filter(x => !!x.start?.dateTime);

const setGCalEventDatesToToday = (events) => {
  const todaysDatePart = new Date().toISOString().split("T")[0];

  return events.map((event) => {
    const startTimePart = new Date(event.start.dateTime).toISOString().split('T')[1];
    const endTimePart = new Date(event.end.dateTime).toISOString().split('T')[1];

    event.start.dateTime = `${todaysDatePart}T${startTimePart}`;
    event.end.dateTime = `${todaysDatePart}T${endTimePart}`;

    return event;
  })  
};

const sortGCalEvents = (events) => { 
  return events.sort((a, b) => {
    const startA = new Date(a.start.dateTime);
    const startB = new Date(b.start.dateTime);

    return startA - startB;
  });
};

const getRoundedGCalEventLength = (event) => {
  if (!event) {
    return null;
  }

  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);

  // Calculate the difference in milliseconds
  const durationMs = end - start;

  // Convert milliseconds to minutes
  const durationMinutes = durationMs / (1000 * 60);

  // Convert minutes to fractional hours
  let durationHours = durationMinutes / 60;

  // Round to the nearest 15 minutes (0.25 hours)
  durationHours = Math.round(durationHours * 4) / 4;

  return durationHours;
};

module.exports = {
  formatDescription,
  roundTimeQuarterHour,
  getDifferenceInMinutes,
  addMinutes,
  getStartOfDay,
  getEndOfDay,
  filterIgnoredGCalEvents,
  filterGCalEventsWithoutStartDateTime,
  setGCalEventDatesToToday,
  sortGCalEvents,
  getRoundedGCalEventLength,
};
