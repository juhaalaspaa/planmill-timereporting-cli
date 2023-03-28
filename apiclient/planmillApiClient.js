const config = require("../config/default");
const FormData = require("form-data");
const axios = require("axios");
const fs = require('fs');

const getToken = async () => {
  try {
    let tokenRaw = fs.readFileSync(config.filePaths.token);
    let token = JSON.parse(tokenRaw);

    if (new Date(token.expireTime) > new Date()) {
      return token;
    }
  } catch {}

  const form = new FormData();
  form.append("client_id", config.planmill.clientId);
  form.append("client_secret", config.planmill.clientSecret);
  form.append("grant_type", "client_credentials");

  return await axios({
    method: "post",
    url: config.planmill.accessTokenUri,
    data: form,
    headers: { ...form.getHeaders() },
  }).then((response) => {
    let token = response.data;
    token.expireTime = new Date(new Date().getTime() + 60*60000);

    fs.writeFile(config.filePaths.token, JSON.stringify(token), { flag: 'w' }, err => {
      if (err) {
        console.error(err);
      }
      // file written successfully
    });
    return response.data;
  });
};

const getTasks = async () => {
  const token = await getToken();

  const projects = await axios({
    method: "get",
    url: `${config.planmill.baseUrl}projects?rowcount=500&viewtemplate=10`,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  const temp = await Promise.all(projects.data.map(project => {
    return axios({
        method: "get",
        url: `${config.planmill.baseUrl}projects/${project.id}/tasks`,
        headers: {
            Authorization: `Bearer ${token.access_token}`,
        },
    });
  }));

  const allTasks = [];

  temp.map(t => { 
    return t.data.map(d => { allTasks.push(d); }); 
  });

  return { tasks: allTasks, projects: projects.data };
};

const postTimeReport = async (timeReport) => {

  const pmTimeReport = {
    start: new Date(timeReport.start).toISOString().replace("Z", "+0000"),
    finish: new Date(timeReport.finish).toISOString().replace("Z", "+0000"),
    project: timeReport.projectId,
    person: config.planmill.userId,
    amount: timeReport.hours * 60,
    comment: timeReport.description,
    task: timeReport.taskId
  }

  const token = await getToken();

  return await axios({
    method: "post",
    url: `${config.planmill.baseUrl}timereports`,
    data: pmTimeReport,
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json;charset=UTF-8'
    },
  }).then((response) => {
    return response.data;
  });
};

const fetchYesterdaysTimeReports = async () => {
  const token = await getToken();

  let url = `${config.planmill.baseUrl}timereports?person=${config.planmill.userId}&period=41`;

  // On monday, fetch fridays timereports
  if(new Date().getDay() == 1) {
    // minus 3 days
    let intervalStart = new Date(new Date().getTime() - 3 * 86400000);
    intervalStart.setHours(0);
    intervalStart.setMinutes(0);
    intervalStart.setSeconds(0);
    intervalStart = intervalStart.toISOString().replace("Z", "+0000");
    // minus 1-2 days
    let intervalFinish = new Date(new Date().getTime() - 2 * 86400000); 
    intervalFinish.setHours(0);
    intervalFinish.setMinutes(0);
    intervalFinish.setSeconds(0);
    intervalFinish = intervalFinish.toISOString().replace("Z", "+0000");

    url = `${config.planmill.baseUrl}timereports?person=${config.planmill.userId}&interval=start&intervalstart=${intervalStart}&intervalfinish=${intervalFinish}`;
  }

  return await axios({
    method: "get",
    url: url,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  }).then((response) => {
    return response.data;
  });
};

module.exports = { getTasks, postTimeReport, fetchYesterdaysTimeReports };
