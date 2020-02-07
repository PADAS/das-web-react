import { store } from '../';
import isNil from 'lodash/isNil';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'react-fast-compare';

import { addModal } from '../ducks/modals';

import { generateMonthsAgoDate } from './datetime';
import { calcUrlForImage } from './img';
import { EVENT_STATE_CHOICES } from '../constants';
import { REPORT_SAVE_ACTIONS } from '../ReportForm/constants';

import ReportFormModal from '../ReportFormModal';

export const displayTitleForEventByEventType = (event) => {
  const { data: { eventTypes } } = store.getState();

  if (event.title) return event.title;

  const matchingType = (eventTypes || []).find(t => t.value === event.event_type);

  if (matchingType) return matchingType.display;
  if (event.event_type) return event.event_type;

  return 'Unknown event type';
};

export const getCoordinatesForEvent = evt => evt.geojson
  && evt.geojson.geometry
  && evt.geojson.geometry.coordinates;


export const collectionHasMultipleValidLocations = collection => getCoordinatesForCollection(collection) && getCoordinatesForCollection(collection).length > 1;

export const getCoordinatesForCollection = collection => collection.contains &&
  collection.contains
    .map(contained => getCoordinatesForEvent(contained.related_event))
    .filter(item => !!item);

export const eventHasLocation = (evt) => {
  if (evt.is_collection) {
    return evt.contains && evt.contains.some(contained => !!getCoordinatesForEvent(contained.related_event));
  }
  return !!evt.location;
};

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

  return props.reduce((params, [key, value], _index) => {
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

export const calcEventFilterForRequest = (params = {}) => {
  const { data: { eventFilter, eventTypes } } = store.getState();

  const toClean = { ...eventFilter, ...params };

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

  return objectToParamString(cleaned);
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

export const generateSaveActionsForReport = (formData, notesToAdd = [], filesToAdd = []) => {
  const report = { ...formData };

  const primarySaveOperation = report.id ? REPORT_SAVE_ACTIONS.updateEvent(report) : REPORT_SAVE_ACTIONS.createEvent(report);
  const fileOperations = [
    ...filesToAdd.map(REPORT_SAVE_ACTIONS.addFile),
  ];

  const noteOperations = [
    ...notesToAdd.map(REPORT_SAVE_ACTIONS.addNote),
  ];

  return [primarySaveOperation, ...fileOperations, ...noteOperations].sort((a, b) => b.priority - a.priority);
};

export const executeReportSaveActions = (saveActions) => {
  let eventID;
  let responses = [];

  return new Promise((resolve, reject) => {
    try {
      saveActions.reduce(async (action, { action: nextAction }, index, collection) => {
        const isPrimaryAction = index === 1;
        const isLast = index === collection.length - 1;
        const results = await action;

        if (isPrimaryAction) {
          eventID = results.data.data.id;
        }

        return nextAction(eventID)
          .then((results) => {
            responses.push(results);
            if (isLast) {
              return resolve(responses);
            }
            return results;
          })
          .catch((error) => reject(error));
      }, Promise.resolve());
    } catch (e) {
      return reject(e);
    }
  });
};

export const openModalForReport = (report, map, config = {}) => {
  const { onSaveSuccess, onSaveError, relationshipButtonDisabled } = config;

  return store.dispatch(
    addModal({
      content: ReportFormModal,
      report,
      relationshipButtonDisabled,
      map,
      onSaveSuccess,
      onSaveError,
      modalProps: {
        className: 'event-form-modal',
      },
    }));
};

export const createNewReportForEventType = ({ value: event_type, icon_id, default_priority: priority = 0 }) => ({
  event_type,
  icon_id,
  is_collection: false,
  state: 'active',
  priority,
  time: new Date(),
  event_details: {},
});

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