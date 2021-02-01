import axios from 'axios';

import { store } from '../';
import { getEventReporters } from '../selectors';

import isNil from 'lodash/isNil';
import merge from 'lodash/merge';
import isEqual from 'react-fast-compare';

import { addModal } from '../ducks/modals';

import { generateMonthsAgoDate } from './datetime';
import { objectToParamString, cleanedUpFilterObject } from './query';
import { calcUrlForImage } from './img';
import { EVENT_STATE_CHOICES } from '../constants';
import ReportFormModal from '../ReportFormModal';
import { EVENT_API_URL } from '../ducks/events';

export const eventTypeTitleForEvent = (event) => {
  const { data: { eventTypes } } = store.getState();
  const matchingType = (eventTypes || []).find(t => t.value === event.event_type);

  if (matchingType) return matchingType.display;
  if (event.event_type) return event.event_type;

  return 'Unknown event type';
};

export const getReporterById = (id) => {
  const reporters = getEventReporters(store.getState());

  return reporters.find(r => r.id === id);
};

export const displayTitleForEvent = (event) => {
  if (event.title) return event.title;

  return eventTypeTitleForEvent(event);
};

export const getCoordinatesForEvent = evt => evt.geojson
  && evt.geojson.geometry
  && evt.geojson.geometry.coordinates;

export const getIdForEvent = evt => evt.id;

export const collectionHasMultipleValidLocations = collection => getCoordinatesForCollection(collection) && getCoordinatesForCollection(collection).length > 1;

export const getCoordinatesForCollection = collection => collection.contains &&
  collection.contains
    .map(contained => getCoordinatesForEvent(contained.related_event))
    .filter(item => !!item);

export const getEventIdsForCollection = collection => collection.contains &&
  collection.contains
    .map(contained => getIdForEvent(contained.related_event))
    .filter(item => !!item);

export const eventHasLocation = (evt) => {
  if (evt.is_collection) {
    return evt.contains && evt.contains.some(contained => !!getCoordinatesForEvent(contained.related_event));
  }
  return !!evt.location;
};

export const eventBelongsToCollection = evt => !!evt.is_contained_in && !!evt.is_contained_in.length;

export const uniqueEventIds = (value, index, self) => { 
  return self.indexOf(value) === index;
};

export const calcEventFilterForRequest = (options = {}) => {
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

  if (format === 'string') return objectToParamString(cleaned);
  if (format === 'object') return cleaned;
  
  throw new Error('invalid format specified');
};

export const calcFriendlyEventTypeFilterString = (eventTypes, eventFilter) => {
  const totalNumberOfEventTypes = eventTypes.length;
  const eventTypeFilterCount = eventFilter.filter.event_type.length;

  if (!eventTypeFilterCount) return 'no report types';
  if (totalNumberOfEventTypes === eventTypeFilterCount) return 'all report types';
  if (eventTypeFilterCount === 1) {
    const eventTypeId = eventFilter.filter.event_type[0];
    const eventType = eventTypes.find(eventType => eventType.id === eventTypeId);
    if (eventType) return `"${eventType.display}" report type`;
  }
  return `${eventTypeFilterCount} report types`;
};

export const calcFriendlyEventStateFilterString = (eventFilter) => {
  const { state } = eventFilter;
  const { label } = EVENT_STATE_CHOICES.find(c => isEqual(state, c.value));

  return label;
};

export const openModalForReport = (report, map, config = {}) => {
  const { onSaveSuccess, onSaveError, onIncidentSaveSuccess, relationshipButtonDisabled, hidePatrols, isPatrolReport = false } = config;

  return store.dispatch(
    addModal({
      content: ReportFormModal,
      report,
      relationshipButtonDisabled,
      hidePatrols,
      isPatrolReport,
      map,
      onSaveSuccess,
      onSaveError,
      onIncidentSaveSuccess,
      modalProps: {
        className: 'event-form-modal',
        // keyboard: false,
      },
    }));
};

export const createNewReportForEventType = ({ value: event_type, icon_id, default_priority: priority = 0 }, data, patrol_segment_id = null) => {

  const location = data && data.location;

  const reportedById = data && data.reportedById;
  const reporter = reportedById && getReporterById(reportedById);
  const time = data && data.time;

  const reported_by = reporter ? reporter : null;
  
  return {
    event_type,
    patrol_segment_id,
    icon_id,
    is_collection: false,
    location,
    // state: 'active',
    priority,
    reported_by,
    time: time ? new Date(time) : new Date(),
    event_details: {},
  };
};

export const createNewIncidentCollection = attributes =>
  createNewReportForEventType(
    { value: 'incident_collection', icon_id: 'incident_collection', is_collection: true, contains: [], ...attributes }
  );

export const generateErrorListForApiResponseDetails = (response) => {
  try {
    const { response: { data: { status: { detail: details } } } } = response;
    return Object.entries(JSON.parse(details.replace(/'/g, '"')))
      .reduce((accumulator, [key, value]) =>
        [{ label: key, message: value }, ...accumulator],
      []);
  } catch (e) {
    return [{ label: 'Unkown error' }];
  }
};

export const filterMapEventsByVirtualDate = (mapEventFeatureCollection, virtualDate) => ({
  ...mapEventFeatureCollection,
  features: mapEventFeatureCollection.features.filter((feature) => {
    return new Date(virtualDate ? virtualDate : new Date()) - new Date(feature.properties.time) >= 0;
  }),
});

export const addDistanceFromVirtualDatePropertyToEventFeatureCollection = (featureCollection, virtualDate, totalRangeDistance, filterNegative = false) => {
  return {
    ...featureCollection,
    features: featureCollection.features
      .reduce((accumulator, item) => {
        const diff = (new Date(virtualDate || new Date())  - new Date(item.properties.time));
        if (filterNegative && diff < 0) return accumulator;
        return [...accumulator, {
          ...item,
          properties: {
            ...item.properties,
            distanceFromVirtualDate: diff / totalRangeDistance,
          },
        }];
      }, []),
  };
};

export const addNormalizingPropertiesToEventDataFromAPI = (event) => {
  if (event.geojson) {
    event.geojson.properties.image = calcUrlForImage(event.geojson.properties.image);
  }
};

export const calcEventFilterTimeRangeDistance = (eventFilterDateRange, virtualDate) => {
  const { lower, upper } = eventFilterDateRange;
  const upperValue = virtualDate ? new Date(virtualDate) :
    (upper ? new Date(upper) : upper);

  const eventFilterDateRangeLength = upperValue - new Date(lower);
  return eventFilterDateRangeLength;
};
export const addBounceToEventMapFeatures = (features, bounceIDs) => {
  let featurePropId = 0;
  const featuresWithIds = features.map((item) => {
    item.id = ++featurePropId;
    // enable bounce using Mapbox's style conditionals
    item.properties.bounce = (bounceIDs.includes(item.properties.id) ) ? 'true' : 'false';
    return item;
  });
  return featuresWithIds;
};

export const validateReportAgainstCurrentEventFilter = (report) => { /* client-side filter validation -- save a round trip request after event updates */
  const { data: { eventFilter, eventTypes } } = store.getState();

  const reportMatchesDateFilter = () => {
    const { filter: { date_range: { lower, upper } } } = eventFilter;
    const { updated_at } = report;
    
    const updateDate = new Date(updated_at);


    if (lower &&
     (updateDate.getTime() < new Date(lower).getTime())
    ) {
      return false;
    }

    if (upper &&
    (updateDate.getTime() > new Date(upper).getTime())
    ) {
      return false;
    }

    return true;
    
  };

  const reportMatchesStateFilter = () => {
    if (!eventFilter.state) return true;
    return eventFilter.state.includes(report.state);
  };

  const reportMatchesEventTypeFilter = () => {
    if (!eventFilter.filter.event_type.length) return true;
    const eventTypeValuesFromFilterIds = eventFilter.filter.event_type
      .map(id => eventTypes.find(type => type.id === id))
      .filter(item => !!item)
      .map(({ value }) => value);

    return eventTypeValuesFromFilterIds.includes(report.event_type);
  };

  const reportMatchesTextFiter = () => {
    const { filter: { text } } = eventFilter;
    if (!text || !text.length) return true;

    const { notes, serial_number, title, event_details } = report;
    const toTest = JSON.stringify({ notes, serial_number, title, event_details }).toLowerCase();

    return toTest.includes(text.toLowerCase());
    
  };

  const reportMatchesPriorityFilter = () => {
    if (!eventFilter.filter.priority.length) return true;
    return eventFilter.filter.priority.includes(report.priority);
  };

  const reportMatchesReportedByFilter = () => {
    if (!eventFilter.filter.reported_by.length) return true;

    if (!!eventFilter.filter.reported_by.length
    && !report.reported_by) return false;
    
    return eventFilter.filter.reported_by.includes(report.reported_by.id);
  };

  return reportMatchesStateFilter()
    && reportMatchesPriorityFilter()
    && reportMatchesReportedByFilter()
    && reportMatchesDateFilter()
    && reportMatchesTextFiter()
    && reportMatchesEventTypeFilter();
};

export const addSegmentToEvent = (segment_id, event_id, event) => {
  const segmentPayload = { patrol_segments: [segment_id] };
  axios.patch(`${EVENT_API_URL}${event_id}/`, segmentPayload)  
    .then(function (response) {
      console.log('add segment response', response);
    })
    .catch(function (error) {
      console.log('add segment error', error);
    });
};
