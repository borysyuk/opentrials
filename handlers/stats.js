'use strict';

function stats(request, reply) {
  reply.view('stats', {
    title: 'Statistics',
  });
}

module.exports = stats;
