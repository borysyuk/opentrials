const opentrialsApi = require('../config').opentrialsApi;

function get(personId) {
  return opentrialsApi
    .then((client) => client.persons.get({ id: personId }))
    .then((response) => response.obj);
}

module.exports = {
  get: get,
};
