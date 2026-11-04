import isNil from 'lodash/isNil';
import merge from 'lodash/merge';

import { cleanedUpFilterObject, objectToParamString } from './query';
import { generateMonthsAgoDate } from './datetime';
import { DEFAULT_EVENT_SORT, SORT_DIRECTION } from '../constants';

import store from '../store';

export const calcSortParamForEventFilter = ([direction, sortProp]) =>
  `${direction === SORT_DIRECTION.down ? '-' : ''}${sortProp.value}`;

export const calcTimePropForSortConfig = ([, sortProp]) => sortProp.value === 'event_time' ? 'time' : sortProp.value;

export const sortEventsBySortConfig = (events, sortConfig) => {
  const [direction] = sortConfig;
  const comparisonProp = calcTimePropForSortConfig(sortConfig);
  const sortValue = (event) => comparisonProp === 'serial_number'
    ? Number(event.serial_number)
    : new Date(event[comparisonProp]).getTime();

  return [...events].sort((a, b) => {
    const value1 = sortValue(a);
    const value2 = sortValue(b);

    if (direction === SORT_DIRECTION.up) {
      return value1 - value2;
    }
    return value2 - value1;
  });
};

export const calcEventFilterForRequest = (options = {}, sortConfig = DEFAULT_EVENT_SORT) => {
  const { data: { eventFilter, eventTypes } } = store.getState();
  const { params, format = 'string' } = options;

  const toClean = merge({}, eventFilter, params);
  delete toClean._persist;

  const cleaned = {
    ...cleanedUpFilterObject(toClean),
    filter: {
      ...cleanedUpFilterObject(toClean.filter),
      date_range: {
        ...cleanedUpFilterObject(toClean.filter.date_range),
        lower: isNil(toClean.filter.date_range.lower) ? generateMonthsAgoDate(1).toISOString() : toClean.filter.date_range.lower,
      },
    },
  };

  if (cleaned.filter.text) {
    cleaned.filter.text = cleaned.filter.text.toLowerCase();
  }

  /* "show all event types" doesn't require an event_type param. 
      delete it for that case, to not overburden the query. */
  if (eventTypes
    && cleaned.filter.event_type
    && eventTypes.length === cleaned.filter.event_type.length) {
    delete cleaned.filter.event_type;
  }

  cleaned.sort_by = calcSortParamForEventFilter(sortConfig);

  if (format === 'string') {
    return objectToParamString(cleaned);
  }

  if (format === 'object') {
    return cleaned;
  }

  throw new Error('invalid format specified');
};
