const opentrialsApi = require('../config').opentrialsApi;

function get(organisationId) {
  return opentrialsApi
    .then((client) => client.organisations.get({ id: organisationId }))
    .then((response) => response.obj);
}

module.exports = {
  get: get,
};
