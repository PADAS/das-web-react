import axios from 'axios';
import { lazy } from 'react';

import store from '../store';
import { getEventReporters } from '../selectors';

import isObject from 'lodash/isObject';
import isEqual from 'react-fast-compare';

import { addModal } from '../ducks/modals';

import { calcUrlForImage } from './img';
import colorVariables from '../common/styles/vars/colors.module.scss';
import { EVENT_STATE_CHOICES } from '../constants';
import { EVENT_API_URL } from '../ducks/events';

import { calcTopRatedReportAndTypeForCollection } from './event-types';

const ReportFormModal = lazy(() => import('../ReportFormModal'));

export const eventWasRecentlyCreatedByCurrentUser = (event, currentUser) => {
  const eventCreationDetails = event?.updates?.[event?.updates?.length - 1];
  const eventCreationUserId = eventCreationDetails?.user?.id;

  if (eventCreationUserId !== currentUser.id) return false;

  const isRecentlyCreated = Math.abs(new Date() - new Date(eventCreationDetails.time)) < 60000; /* did it happen less than a minute ago? */

  if (!isRecentlyCreated) return false;

  return true;

};

export const eventTypeTitleForEvent = (event, eventTypes = []) => {
  const isPatrol = !!event?.patrol_segments?.length && isObject(event.patrol_segments[0]);

  const matchingType = eventTypes.find(t => (t.value) ===
    (isPatrol ? event.patrol_segments[0].patrol_type : event.event_type)
  );


  if (matchingType) return matchingType.display;
  if (event.event_type) return event.event_type;

  return `Unknown ${isPatrol ? 'patrol' : 'event'} type`;
};

export const getReporterById = (id) => {
  const reporters = getEventReporters(store.getState());

  return reporters.find(r => r.id === id);
};

export const displayTitleForEvent = (event, eventTypes) => {
  if (event.title) return event.title;

  return eventTypeTitleForEvent(event, eventTypes);
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

export const eventBelongsToCollection = evt => !!evt?.is_contained_in?.length;
export const eventBelongsToPatrol = evt => !!evt?.patrols?.length && !!evt?.patrols?.[0];

export const uniqueEventIds = (value, index, self) => {
  return self.indexOf(value) === index;
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

  return store.dispatch(
    addModal({
      content: ReportFormModal,
      report,
      map,
      ...config,
      modalProps: {
        className: 'event-form-modal',
      },
    }));
};

export const createNewReportForEventType = ({ value: event_type, icon_id, default_priority: priority = 0 }, data) => {

  const location = data && data.location;

  const reportedById = data && data.reportedById;
  const reporter = reportedById && getReporterById(reportedById);
  const time = data && data.time;

  const reported_by = reporter ? reporter : null;

  return {
    event_type,
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

export const validateReportAgainstCurrentEventFilter = (report, storeFromProps) => { /* client-side filter validation -- save a round trip request after event updates */
  const { data: { eventFilter, eventTypes } } = (storeFromProps || store).getState();

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

export const addPatrolSegmentToEvent = (segment_id, event_id) => {
  const segmentPayload = { patrol_segments: [segment_id] };
  return axios.patch(`${EVENT_API_URL}${event_id}/`, segmentPayload)
    .catch(function (error) {
      console.warn('add segment error', error);
    });
};

export const calcDisplayPriorityForReport = (report, eventTypes) => {
  if (!!report.priority) return report.priority;

  if (report.is_collection) {
    const topRatedReportAndType = calcTopRatedReportAndTypeForCollection(report, eventTypes);
    if (!topRatedReportAndType) return report.priority;

    return (topRatedReportAndType.related_event && !!topRatedReportAndType.related_event.priority) ?
      topRatedReportAndType.related_event.priority
      : (topRatedReportAndType.event_type && !!topRatedReportAndType.event_type.default_priority) ?
        topRatedReportAndType.event_type.default_priority
        : report.priority;
  }

  return report.priority;
};

export const PRIORITY_COLOR_MAP = {
  300: {
    base: colorVariables.red,
    background: colorVariables.redBg,
    name: 'Red',
  },
  200: {
    base: colorVariables.amber,
    background: colorVariables.amberBg,
    name: 'Amber',
  },
  100: {
    base: colorVariables.green,
    background: colorVariables.greenBg,
    name: 'Green',
  },
  0: {
    base: colorVariables.gray,
    background: colorVariables.grayBg,
    name: 'Gray',
  },
};
