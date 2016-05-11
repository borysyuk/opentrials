'use strict';
const server = require('../../server');

describe('stats handler', () => {
  describe('GET /stats', () => {
    describe('API is OK', () => {
      let response;

      before(() => {
        return server.inject('/stats')
          .then((_response) => {
            response = _response;
          });
      });

      it('is successful', () => {
        response.statusCode.should.equal(200)
      });

      it('uses the "stats" template', () => (
        response.request.response.source.template.should.equal('stats')
      ));

      it('sets the title to the Statistics', () => {
        const context = response.request.response.source.context;
        context.title.should.equal('Statistics');
      });
    });
  });
});
