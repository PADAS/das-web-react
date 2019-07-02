import { store } from '../';
import isNil from 'lodash/isNil';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'react-fast-compare';

import { fetchEventTypeSchema } from '../ducks/event-schemas';
import { addModal } from '../ducks/modals';

import { generateMonthsAgoDate } from './datetime';
import { EVENT_STATE_CHOICES } from '../constants';
import { REPORT_SAVE_ACTIONS } from '../ReportForm/constants';

import ReportForm from '../ReportForm';

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

export const openModalForReport = async (event, map, config = {}) => {
  const { data: { eventSchemas } } = store.getState();
  const { onSaveSuccess, onSaveError, relationshipButtonDisabled } = config;
  const { event_type } = event;


  const promise = eventSchemas[event_type] ? Promise.resolve() : store.dispatch(fetchEventTypeSchema(event_type));

  await promise;

  return store.dispatch(
    addModal({
      content: ReportForm,
      report: event,
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
    { value: 'incident_collection', icon_id: 'incident_collection', is_collection: true, ...attributes }
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