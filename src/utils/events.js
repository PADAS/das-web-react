import axios from 'axios';
import center from '@turf/center';
import centerOfMass from '@turf/center-of-mass';
import { customizeValidator } from '@rjsf/validator-ajv6';
import { featureCollection } from '@turf/helpers';
import isObject from 'lodash/isObject';
import metaSchemaDraft04 from 'ajv/lib/refs/json-schema-draft-04.json';

import { addNoteToEvent, createEvent, EVENT_API_URL, updateEvent, uploadEventFile } from '../ducks/events';
import { calcTopRatedReportAndTypeForCollection } from './event-types';
import { calcUrlForImage } from './img';
import { EVENT_FORM_STATES } from '../constants';
import { getEventReporters } from '../selectors';
import store from '../store';

import colorVariables from '../common/styles/vars/colors.module.scss';

export const eventWasRecentlyEditedByCurrentUser = (event, currentUser) => {
  const eventCreationDetails = event?.updates?.[0];
  const eventCreationUserId = eventCreationDetails?.user?.id;

  if (eventCreationUserId !== currentUser.id) {
    return false;
  }

  const isRecentlyCreated = Math.abs(new Date() - new Date(eventCreationDetails.time)) < 60000;
  if (!isRecentlyCreated) {
    return false;
  }

  return true;
};

export const eventTypeTitleForEvent = (event, eventTypes = []) => {
  const isPatrol = !!event?.patrol_segments?.length && isObject(event.patrol_segments[0]);
  const matchingType = eventTypes
    .find((type) => type.value === (isPatrol ? event.patrol_segments[0].patrol_type : event.event_type));

  if (matchingType) {
    return matchingType.display;
  }
  return event.event_type || null;
};

export const getReporterById = (id) => {
  const reporters = getEventReporters(store.getState());

  return reporters.find((reporter) => reporter.id === id);
};

export const displayTitleForEvent = (event, eventTypes) => event.title || eventTypeTitleForEvent(event, eventTypes);

export const getCoordinatesForEvent = (event) => {
  if (event?.geojson?.geometry?.type === 'Polygon') {
    return event.geojson.geometry.coordinates.reduce((accumulator, shape) => [...accumulator, ...shape], []);
  }
  return event?.geojson?.geometry?.coordinates;
};

export const getCoordinatesForCollection = (collection) => {
  if (collection.contains){
    const collectionCoords = collection.contains
      .map(({ related_event }) => getCoordinatesForEvent(related_event))
      .filter((item) => !!item);
    const collectionHasSingleCoordsItem = collectionCoords.length === 1;

    // if the collection has only 1 item with valid coords return that value in order to use it in JTLB logic, if not,
    // return all the event coords available in the collection
    return collectionHasSingleCoordsItem ? collectionCoords[0] : collectionCoords;
  }
  return null;
};

export const collectionHasMultipleValidLocations = (collection) => getCoordinatesForCollection(collection)?.length > 1;

export const getEventIdsForCollection = (collection) => collection.contains &&
  collection.contains
    .map((contained) => contained.related_event.id)
    .filter((item) => !!item);

export const eventBelongsToCollection = (event) => !!event?.is_contained_in?.length;

export const eventBelongsToPatrol = event => !!event?.patrol_segments?.length;

export const uniqueEventIds = (value, index, self) => self.indexOf(value) === index;

export const createNewReportForEventType = (reportType, data) => {
  const location = data?.location;
  const reportedById = data?.reportedById;
  const time = data?.time;

  const reporter = reportedById && getReporterById(reportedById);

  return {
    event_details: {},
    event_type: reportType.value,
    icon_id: reportType.icon_id,
    is_collection: false,
    location,
    priority: reportType.default_priority || 0,
    reported_by: reporter || null,
    state: reportType.default_state || EVENT_FORM_STATES.ACTIVE,
    time: time ? new Date(time) : new Date(),
  };
};

export const createNewIncidentCollection = (attributes) => createNewReportForEventType({
  contains: [],
  icon_id: 'incident_collection',
  is_collection: true,
  value: 'incident_collection',
  ...attributes,
});

export const filterMapEventsByVirtualDate = (mapEventFeatureCollection, virtualDate) => ({
  ...mapEventFeatureCollection,
  features: mapEventFeatureCollection.features
    .filter((feature) => new Date(virtualDate ? virtualDate : new Date()) - new Date(feature.properties.time) >= 0),
});

export const addDistanceFromVirtualDatePropertyToEventFeatureCollection = (
  featureCollection,
  virtualDate,
  totalRangeDistance
) => ({
  ...featureCollection,
  features: featureCollection.features
    .reduce((accumulator, item) => {
      const diff = new Date(virtualDate || new Date()) - new Date(item.properties.time);
      if (diff < 0) {
        return accumulator;
      }
      return [
        ...accumulator,
        {
          ...item,
          properties: {
            ...item.properties,
            distanceFromVirtualDate: diff / totalRangeDistance,
          },
        },
      ];
    }, []),
});

export const addNormalizingPropertiesToEventDataFromAPI = (event) => {
  if (event?.geojson?.properties?.image) {
    event.geojson.properties.image = calcUrlForImage(event.geojson.properties.image);
  }

  if (event?.geojson?.features) {
    event.geojson.features = event.geojson.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        image: calcUrlForImage(feature.properties.image),
      },
    }));
  }
};

export const addBounceToEventMapFeatures = (features, bounceIDs) => {
  const featuresWithIds = features.map((item, index) => {
    item.id = index + 1;
    item.properties.bounce = bounceIDs.includes(item.properties.id) ? 'true' : 'false';
    return item;
  });
  return featuresWithIds;
};

export const validateReportAgainstCurrentEventFilter = (report, storeFromProps) => {
  const { data: { eventFilter, eventTypes } } = (storeFromProps || store).getState();

  const reportMatchesDateFilter = () => {
    const { filter: { date_range: { lower, upper } } } = eventFilter;
    const { updated_at } = report;

    const updateDate = new Date(updated_at);

    if (lower && (updateDate.getTime() < new Date(lower).getTime())) {
      return false;
    }
    if (upper && (updateDate.getTime() > new Date(upper).getTime())) {
      return false;
    }
    return true;
  };

  const reportMatchesStateFilter = () => !eventFilter.state || eventFilter.state.includes(report.state);

  const reportMatchesEventTypeFilter = () => {
    if (!eventFilter.filter.event_type.length) {
      return true;
    }

    const eventTypeValuesFromFilterIds = eventFilter.filter.event_type
      .map((id) => eventTypes.find((type) => type.id === id))
      .filter((item) => !!item)
      .map(({ value }) => value);
    return eventTypeValuesFromFilterIds.includes(report.event_type);
  };

  const reportMatchesTextFiter = () => {
    const { filter: { text } } = eventFilter;
    if (!text || !text.length) {
      return true;
    }

    const { notes, serial_number, title, event_details } = report;
    const toTest = JSON.stringify({ notes, serial_number, title, event_details }).toLowerCase();

    return toTest.includes(text.toLowerCase());
  };

  const reportMatchesPriorityFilter = () => !eventFilter.filter.priority.length
    || eventFilter.filter.priority.includes(report.priority);

  const reportMatchesReportedByFilter = () => {
    if (!eventFilter.filter.reported_by.length) {
      return true;
    }
    if (!!eventFilter.filter.reported_by.length && !report.reported_by) {
      return false;
    }
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
    .catch((error) => console.warn('add segment error', error));
};

export const calcDisplayPriorityForReport = (report, eventTypes) => {
  if (!!report.priority) {
    return report.priority;
  }

  if (report.is_collection) {
    const topRatedReportAndType = calcTopRatedReportAndTypeForCollection(report, eventTypes);
    if (!topRatedReportAndType) {
      return report.priority;
    }

    return (topRatedReportAndType.related_event && !!topRatedReportAndType.related_event.priority)
      ? topRatedReportAndType.related_event.priority
      : (topRatedReportAndType.event_type && !!topRatedReportAndType.event_type.default_priority)
        ? topRatedReportAndType.event_type.default_priority
        : report.priority;
  }

  return report.priority;
};

export const calcGeometryTypeForReport = (report, eventTypes) => {
  const matchingType = eventTypes.find((type) => type.value === report.event_type);

  return matchingType?.geometry_type;
};

export const PRIORITY_COLOR_MAP = {
  300: {
    base: colorVariables.red,
    background: colorVariables.redBg,
    key: 'red',
  },
  200: {
    base: colorVariables.amber,
    background: colorVariables.amberBg,
    key: 'amber',
  },
  100: {
    base: colorVariables.green,
    background: colorVariables.greenBg,
    key: 'green',
  },
  0: {
    base: colorVariables.gray,
    background: colorVariables.grayBg,
    key: 'none',
  },
};

export const setOriginalTextToEventNotes = (event) => {
  if (!event){
    return null;
  }

  const { notes = [] } = event;
  return {
    ...event,
    notes: notes.map((note) => ({ ...note, originalText: !note.originalText ? note.text : note.originalText }))
  };
};

export const isReportActive = (report) => ['active', 'new'].includes(report?.state);

export const formValidator = customizeValidator({ additionalMetaSchemas: [metaSchemaDraft04] });

export const REPORT_SAVE_ACTIONS = {
  create: (data) => ({
    action: () => store.dispatch(createEvent(data)),
    priority: 300,
  }),
  update: (data) => ({
    action: () => store.dispatch(updateEvent(data)),
    priority: 250,
  }),
  addNote: (note) => ({
    action: (event_id) => store.dispatch(addNoteToEvent(event_id, note)),
    priority: 200,
  }),
  addFile: (file) => ({
    action: (event_id) => store.dispatch(uploadEventFile(event_id, file)),
    priority: 200,
  }),
};

export const getReportLink = (report) => {
  let reportLink = `${window.location.origin}/reports/${report.id}`;
  if (report?.geojson) {
    const geoJSONCentroidCoordinates = centerOfMass(report.geojson).geometry.coordinates;
    reportLink += `?lnglat=${geoJSONCentroidCoordinates[0]},${geoJSONCentroidCoordinates[1]}`;
  } else if (report.is_collection) {
    const containedReportsFeatures = report.contains
      .map((containedReport) => containedReport.related_event.geojson)
      .filter((feature) => !!feature);
    const collectionCenterCoordinates = center(featureCollection(containedReportsFeatures)).geometry.coordinates;
    reportLink += `?lnglat=${collectionCenterCoordinates[0]},${collectionCenterCoordinates[1]}`;
  }

  return reportLink;
};
