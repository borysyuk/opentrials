const opentrialsApi = require('../config').opentrialsApi;

function get(problemId) {
  return opentrialsApi
    .then((client) => client.problems.get({ id: problemId }))
    .then((response) => response.obj);
}

module.exports = {
  get: get,
};
