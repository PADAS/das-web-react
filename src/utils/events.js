import { store } from '../';
import isNil from 'lodash/isNil';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'react-fast-compare';

import { fetchEventTypeSchema } from '../ducks/event-schemas';
import { addModal } from '../ducks/modals';

import { generateMonthsAgoDate } from '../utils/datetime';
import { EVENT_STATE_CHOICES } from '../constants';

import ReportForm from '../ReportForm';

export const displayTitleForEventByEventType = (event, eventTypes) => {
  if (event.title) return event.title;

  const matchingType = eventTypes.find(t => t.value === event.event_type);

  if (matchingType) return matchingType.display;
  if (event.event_type) return event.event_type;

  return 'Unknown event type';
};

export const getCoordinatesForEvent = evt => evt.geojson
  && evt.geojson.geometry
  && evt.geojson.geometry.coordinates;

export const eventHasLocation = (evt) => {
  if (evt.is_collection) {
    return evt.contains && evt.contains.some(contained => !!getCoordinatesForEvent(contained.related_event))
  }
  return !!evt.location;
}

export const eventBelongsToCollection = evt => !!evt.is_contained_in && !!evt.is_contained_in.length;


const cleanedUpFilterObject = (filter) =>
  Object.entries(filter)
    .reduce((accumulator, [key, value]) => {
      if (isBoolean(value) || (!isNil(value) && !isEmpty(value))) {
        accumulator[key] = value;
      }
      return accumulator;
    }, {});


const objectToParamString = (obj) => {
  const props = Object.entries(obj);

  return props.reduce((params, [key, value], index) => {
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        params.append(key, v);
      });
    } else if (typeof value === 'object') {
      params.append(key, JSON.stringify(value));
    } else {
      params.append(key, value);
    }
    return params;
  }, new URLSearchParams()).toString();
};

export const calcEventFilterForRequest = (params) => {
  const { data: { eventFilter } } = store.getState();

  const toClean = { ...params, ...eventFilter };

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

  return objectToParamString(cleaned);
};

export const calcFriendlyEventTypeFilterString = (eventTypes, eventFilter) => {
  const totalNumberOfEventTypes = eventTypes.length;
  const eventTypeFilterCount = eventFilter.filter.event_type.length;

  if (!eventTypeFilterCount) return 'no report types';
  if (totalNumberOfEventTypes === eventTypeFilterCount) return 'all report types';
  return `${eventTypeFilterCount} report types`;
};

export const calcFriendlyEventStateFilterString = (eventFilter) => {
  const { state } = eventFilter;
  const { label } = EVENT_STATE_CHOICES.find(c => isEqual(state, c.value));

  return label;
};

export const openModalForEvent = async (event, map) => {
  const { data: { eventSchemas } } = store.getState();
  const { event_type } = event;

  const promise = eventSchemas[event_type] ? Promise.resolve() : store.dispatch(fetchEventTypeSchema(event_type));

  await promise;

  return store.dispatch(
    addModal({
      content: ReportForm,
      report: event,
      map,
      modalProps: {
        className: 'event-form-modal',
      },
    }));
};




/*
{
  state: Array<String> | of ‘new’, ‘active’, ‘resolved’,
  bbox: String | (Number,Number,Number,Number},
  is_collection: Bool,
  exclude_contained: Bool,
  include_files: Bool,
  include_notes: Bool,
  include_details: Bool,
  include_related_events: Bool,
  filter: {
    event_type: Array<String> | of event_type IDs,
    event_category: Array<String> | of event_category IDs,
    reported_by: Array<String> | of reported_by IDs,
    text: String | search substring,
    date_range: {
      lower: String | ISO8601 date,
      upper: String | ISO8601 date,
    },
    duration: String | ISO8601 duration value ("in the last X days"),
    priority: Array<Int> | of priority levels (0, 100, 200, 300)
  }
*/