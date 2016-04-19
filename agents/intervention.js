'use strict';

const opentrialsApi = require('../config').opentrialsApi;

function get(interventionId) {
  return opentrialsApi
    .then((client) => client.interventions.get({ id: interventionId }))
    .then((response) => response.obj);
}

module.exports = {
  get: get,
};
