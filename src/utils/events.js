import { store } from '../';
import isNil from 'lodash/isNil';
import isEmpty from 'lodash/isEmpty';

export const displayTitleForEventByEventType = (event, eventTypes) => {
  if (event.title) return event.title;

  const matchingType = eventTypes.find(t => t.value === event.event_type);

  if (matchingType) return matchingType.display;
  if (event.event_type) return event.event_type;

  return 'Unknown event type';
}

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
      if (!isNil(value) && !isEmpty(value)) {
        accumulator[key] = value;
      }
      return accumulator;
    }, {});

export const calcEventFilterForRequest = () => {
  const { data: { eventFilter } } = store.getState();

  const cleaned = {
    ...eventFilter,
    filter: {
      ...cleanedUpFilterObject(eventFilter.filter),
      date_range: cleanedUpFilterObject(eventFilter.filter.date_range),
    },
  };

  if (isEmpty(cleaned.filter.date_range)) {
    delete cleaned.filter.date_range;
  }

  if (isEmpty(cleaned.filter)) delete cleaned.filter;
  return cleaned;
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