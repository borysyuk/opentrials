'use strict';
const server = require('../../server');

describe('organisations handler', () => {
  describe('GET /organisations/{id}', () => {
    describe('API is OK', () => {
      const organisation = JSON.parse(JSON.stringify(
        fixtures.getOrganisation()
      ));
      let response;

      before(() => {
        apiServer.get('/organisations/'+organisation.id).reply(200, organisation);

        return server.inject('/organisations/'+organisation.id)
          .then((_response) => {
            response = _response;
          });
      });

      it('is successful', () => {
        response.statusCode.should.equal(200)
      });

      it('uses the "organisations-list" template', () => (
        response.request.response.source.template.should.equal('organisations-details')
      ));

      it('adds the requested organisation to the context', () => {
        const context = response.request.response.source.context;
        context.organisation.should.deepEqual(organisation);
      });

      it('sets the title to the organisation.name', () => {
        const context = response.request.response.source.context;
        context.title.should.equal(organisation.name);
      });

      it('returns 404 when organisation doesnt exist', () => {
        apiServer.get('/organisations/foo').reply(404);

        return server.inject('/organisations/foo')
          .then((_response) => {
            _response.statusCode.should.equal(404);
          });
      });
    });

    describe('API is not OK', () => {
      it('returns error 502', () => {
        apiServer.get('/organisations/foo').reply(500);

        return server.inject('/organisations/foo')
          .then((_response) => {
            _response.statusCode.should.equal(502);
          });
      });
    });
  });
});
