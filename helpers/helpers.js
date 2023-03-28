const formatDescription = (desc) => {
    desc = desc.replace("Feature ", "#");
    desc = desc.replace("Product Backlog Item ", "#");
    desc = desc.replace("Task ", "#");
    desc = desc.replace("Bug ", "#");
    
    return desc;
}

const roundTimeQuarterHour = (time) => {
    let timeToReturn = new Date(time);

    timeToReturn.setMilliseconds(Math.round(timeToReturn.getMilliseconds() / 1000) * 1000);
    timeToReturn.setSeconds(Math.round(timeToReturn.getSeconds() / 60) * 60);
    timeToReturn.setMinutes(Math.round(timeToReturn.getMinutes() / 15) * 15);
    return timeToReturn;
}

const getDifferenceInMinutes = (startTime, endTime) => {
    let difference = endTime.getTime() - startTime.getTime();
    return Math.round(difference / 60000);
};

module.exports = { formatDescription, roundTimeQuarterHour, getDifferenceInMinutes };
