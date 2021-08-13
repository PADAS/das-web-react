import isEqual from 'react-fast-compare';
import isNil from 'lodash/isNil';
import merge from 'lodash/merge';

import { cleanedUpFilterObject, objectToParamString } from './query';
import { generateMonthsAgoDate } from './datetime';
import { INITIAL_FILTER_STATE } from '../ducks/event-filter';
import store from '../store';

const EVENT_SORT_OPTIONS = [
  {
    label: 'Updated at',
    value: 'updated_at',
  },
  {
    label: 'Created at',
    value: 'created_at',
  },
  {
    label: 'Report date',
    value: 'event_time',
  },
];


export const isFilterModified = ({ state, filter: { priority, reported_by, text } }) => (
  !isEqual(INITIAL_FILTER_STATE.state, state)
    || !isEqual(INITIAL_FILTER_STATE.filter.priority, priority)
    || !isEqual(INITIAL_FILTER_STATE.filter.text, text)
    || !isEqual(INITIAL_FILTER_STATE.filter.reported_by, reported_by)
);

export const calcSortParamForEventFilter = (sortConfig) => {
  const [direction, sortProp] = sortConfig;
  
  return `${direction === '-' ? direction : ''}${sortProp.value}`;
};

export const calcTimePropForSortConfig = (sortConfig) => {
  const [, sortProp] = sortConfig;
  return sortProp.value === 'event_time' ? 'time' : sortProp.value;
};

export const sortEventsBySortConfig = (events, sortConfig) => {
  const [direction] = sortConfig;
  const comparisonProp = calcTimePropForSortConfig(sortConfig);

  return [...events].sort((a, b) => {
    const date1 = new Date(a[comparisonProp]).getTime();
    const date2 = new Date(b[comparisonProp]).getTime();

    if (direction === '+') return date1 - date2;
    return date2 - date1;
  });
};

export const calcEventFilterForRequest = (options = {}, sortConfig = ['-', EVENT_SORT_OPTIONS[0]]) => {
  const { data: { eventFilter, eventTypes } } = store.getState();
  const { params, format = 'string' } = options;

  const toClean = merge({}, eventFilter, params);

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

  if (format === 'string') return objectToParamString(cleaned);
  if (format === 'object') return cleaned;
  
  throw new Error('invalid format specified');
};