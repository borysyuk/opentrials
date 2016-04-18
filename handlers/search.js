'use strict';

const URL = require('url');
const Boom = require('boom');
const _ = require('lodash');
const trials = require('../agents/trials');
const locations = require('../agents/locations');
const Joi = require('joi');

function getPagination(url, currentPage, perPage, maxPages, totalCount) {
  const getPageUrl = (pageNumber) => {
    const pageUrl = _.omit(url, 'search');
    pageUrl.query.page = pageNumber;
    return URL.format(pageUrl);
  };
  let numberOfPages = Math.ceil(totalCount / perPage);
  if (numberOfPages > maxPages) {
    numberOfPages = maxPages;
  }

  const previousPage = (currentPage > 1) ? currentPage - 1 : 1;
  const nextPage = (currentPage < numberOfPages) ? currentPage + 1 : numberOfPages;
  const visiblePages = 10;
  const halfCountOfVisiblePage = Math.floor((visiblePages - 1) / 2);
  let firstVisiblePage = (currentPage > halfCountOfVisiblePage)
                         ? currentPage - halfCountOfVisiblePage
                         : 1;
  const lastVisiblePage = (firstVisiblePage + visiblePages > numberOfPages)
                          ? numberOfPages
                          : firstVisiblePage + visiblePages - 1;

  if (lastVisiblePage - firstVisiblePage < visiblePages && lastVisiblePage - visiblePages >= 1) {
    firstVisiblePage = lastVisiblePage - visiblePages + 1;
  }

  const pages = _.range(firstVisiblePage, lastVisiblePage + 1).map((pageNumber) => (
    {
      page: pageNumber,
      label: pageNumber,
      url: getPageUrl(pageNumber),
    }
  ));

  if (numberOfPages <= 1) {
    return [];
  }

  return [
    { page: 1, label: '«', url: getPageUrl(1) },
    { page: previousPage, label: '‹', url: getPageUrl(previousPage) },
    ...pages,
    { page: nextPage, label: '›', url: getPageUrl(nextPage) },
    { page: numberOfPages, label: '»', url: getPageUrl(numberOfPages) },
  ];
}

function getFilters(query) {
  const filters = {};

  if (query.location) {
    filters.location = `"${query.location}"`;
  }

  const registrationDateStart = query.registration_date_start;
  const registrationDateEnd = query.registration_date_end;
  if (registrationDateStart || registrationDateEnd) {
    const registrationDate = `[${registrationDateStart || '*'} TO ${registrationDateEnd || '*'}]`;
    filters.registration_date = registrationDate;
  }

  return filters;
}

function searchPage(request, reply) {
  const query = request.query;

  var schema = Joi.object().keys({
    page: Joi.number().integer().min(1),
    registration_date_start: Joi.date().format('YYYY-MM-DD').empty(''),
    registration_date_end: Joi.date().format('YYYY-MM-DD').empty(''),
    location: Joi.string().empty(''),
    q: Joi.string().required()
  });

  var badRequest = false;
  Joi.validate(query, schema, (err, value) => {
    badRequest = (err !== null);
  });

  if (badRequest) {
    reply(
      Boom.badRequest('invalid query')
    )
    return;
  }

  const queryStr = query.q;
  const page = (query.page) ? parseInt(query.page, 10) : undefined;
  const perPage = 10;
  const maxPages = 100;
  const filters = getFilters(query);

  Promise.all([
    trials.search(queryStr, page, perPage, filters),
    locations.list(),
  ]).then((responses) => {
    const trialsResponse = responses[0];
    const locationsResponse = responses[1];
    const currentPage = page || 1;
    const pagination = getPagination(request.url, currentPage,
                                     perPage, maxPages,
                                     trialsResponse.total_count);

    reply.view('search', {
      title: 'Search',
      query,
      currentPage,
      pagination,
      advancedSearchIsVisible: Object.keys(filters).length > 0,
      trials: trialsResponse,
      locations: locationsResponse,
    });
  }).catch((err) => (
    reply(
      Boom.badGateway('Error accessing OpenTrials API.', err)
    )
  ));
}

module.exports = searchPage;
