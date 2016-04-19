'use strict';

const URL = require('url');
const Boom = require('boom');
const _ = require('lodash');
const trials = require('../agents/trials');
const locations = require('../agents/locations');
const Joi = require('joi');

function ensureIsArray(object) {
  let result = object;
  if (result !== undefined && !Array.isArray(result)) {
    result = [result];
  }
  return result;
}

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
  const ensureIsArrayAndQuoteElements = (values) => (
    ensureIsArray(values).map((val) => `"${val}"`)
  );

  if (query.problem) {
    filters.problem = ensureIsArrayAndQuoteElements(query.problem);
  }
  if (query.intervention) {
    filters.intervention = ensureIsArrayAndQuoteElements(query.intervention);
  }
  if (query.location) {
    filters.location = ensureIsArrayAndQuoteElements(query.location);
  }
  if (query.person) {
    filters.person = ensureIsArrayAndQuoteElements(query.person);
  }
  if (query.organisation) {
    filters.organisation = ensureIsArrayAndQuoteElements(query.organisation);
  }

  const registrationDateStart = query.registration_date_start;
  const registrationDateEnd = query.registration_date_end;
  if (registrationDateStart || registrationDateEnd) {
    const registrationDate = `[${registrationDateStart || '*'} TO ${registrationDateEnd || '*'}]`;
    filters.registration_date = registrationDate;
  }

  const sampleSizeStart = query.sample_size_start;
  const sampleSizeEnd = query.sample_size_end;
  if (sampleSizeStart || sampleSizeEnd) {
    filters.target_sample_size = `[${sampleSizeStart || '*'} TO ${sampleSizeEnd || '*'}]`;
  }

  const gender = query.gender;
  if (gender) {
    filters.gender = `${gender} OR both`;
  }

  const hasPublishedResults = query.has_published_results;
  if (hasPublishedResults) {
    filters.has_published_results = (hasPublishedResults === 'true');
  }

  return filters;
}

function searchPage(request, reply) {
  const query = request.query;

  const schema = Joi.object().keys({
    page: Joi.number().integer().min(1).max(100),
    registration_date_start: Joi.date().format('YYYY-MM-DD').empty(''),
    registration_date_end: Joi.date().format('YYYY-MM-DD').empty(''),
    location: Joi.array().single(true).items(Joi.string().empty('')),
    q: Joi.string().empty(''),
    sample_size_start: Joi.number().integer().empty(''),
    sample_size_end: Joi.number().integer().empty(''),
  });

  const searchParams = {
    page: query.page,
    registration_date_start: query.registration_date_start,
    registration_date_end: query.registration_date_end,
    location: query.location,
    q: query.q,
    sample_size_start: query.sample_size_start,
    sample_size_end: query.sample_size_end,
  };

  let badRequest = false;
  Joi.validate(searchParams, schema, (err) => {
    badRequest = (err !== null);
  });

  if (badRequest) {
    reply(
      Boom.badRequest('invalid query')
    );
    return;
  }

  const queryStr = query.q;
  const page = (query.page) ? parseInt(query.page, 10) : undefined;
  const perPage = 10;
  const maxPages = 100;
  const filters = getFilters(query);

  if (query.problem !== undefined) {
    query.problem = ensureIsArray(query.problem);
  }
  if (query.intervention !== undefined) {
    query.intervention = ensureIsArray(query.intervention);
  }
  if (query.location !== undefined) {
    query.location = ensureIsArray(query.location);
  }
  if (query.person !== undefined) {
    query.person = ensureIsArray(query.person);
  }
  if (query.organisation !== undefined) {
    query.organisation = ensureIsArray(query.organisation);
  }

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
