// reselect explanation and usage https://redux.js.org/recipes/computing-derived-data#connecting-a-selector-to-the-redux-store
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { featureCollection } from '@turf/helpers';
import isEqual from 'react-fast-compare';

import { createFeatureCollectionFromEvents, addIconToGeoJson } from '../utils/map';
import { calcUrlForImage } from '../utils/img';
import { mapReportTypesToCategories } from '../utils/event-types';

export const createSelector = createSelectorCreator(
  defaultMemoize,
  isEqual,
);

const mapEvents = ({ data: { mapEvents: { events } } }) => events;
const feedEvents = ({ data: { feedEvents } }) => feedEvents;
const feedIncidents = ({ data: { feedIncidents } }) => feedIncidents;
const eventStore = ({ data: { eventStore } }) => eventStore;
const hiddenFeatureIDs = ({ view: { hiddenFeatureIDs } }) => hiddenFeatureIDs;
export const featureSets = ({ data: { featureSets } }) => featureSets;
const getReportSchemas = ({ data: { eventSchemas } }, { report }) => eventSchemas[report.event_type];
const userLocation = ({ view: { userLocation } }) => userLocation;
const showUserLocation = ({ view: { showUserLocation } }) => showUserLocation;
export const getTimeSliderState = ({ view: { timeSliderState } }) => timeSliderState;
export const getEventFilterDateRange = ({ data: { eventFilter: { filter: { date_range } } } }) => date_range;
const getEventReporters = ({ data: { eventSchemas } }) => eventSchemas.globalSchema
  ? eventSchemas.globalSchema.properties.reported_by.enum_ext
    .map(({ value }) => value)
  : [];

export const userLocationCanBeShown = createSelector(
  [userLocation, showUserLocation],
  (userLocation, showUserLocation) => userLocation && showUserLocation,
);

const userCreatableEventTypesByCategory = ({ data: { eventTypes } }) =>
  mapReportTypesToCategories(eventTypes)
    .filter((category) => {
      if (category.flag && category.flag === 'user') {
        return category.permissions.includes('create');
      }
      if (!category.flag) return true;
      return false;
    });

export const getMapEventFeatureCollection = createSelector(
  [mapEvents, eventStore],
  (mapEvents, eventStore) => createFeatureCollectionFromEvents(mapEvents
    .map(id => eventStore[id])
    .filter(item => !!item))
);

export const getFeedEvents = createSelector(
  [feedEvents, eventStore],
  (feedEvents, eventStore) => ({
    ...feedEvents,
    results: feedEvents.results
      .map(id => eventStore[id])
      .filter(item => !!item),
  }),
);

export const getFeedIncidents = createSelector(
  [feedIncidents, eventStore],
  (feedIncidents, eventStore) => ({
    ...feedIncidents,
    results: feedIncidents.results
      .map(id => eventStore[id])
      .filter(item => !!item),
  }),
);

export const getUserCreatableEventTypesByCategory = createSelector(
  [userCreatableEventTypesByCategory],
  categories => categories,
);


export const reportedBy = createSelector(
  [getEventReporters],
  reporters => reporters,
);

export const getFeatureSetFeatureCollectionsByType = createSelector(
  [featureSets, hiddenFeatureIDs],
  (featureSets, hiddenFeatureIDs) => {
    const allFeatures = featureSets.reduce((accumulator, data) =>
      [...accumulator,
        ...data.geojson.features
          .filter(f => !hiddenFeatureIDs.includes(f.properties.id))
          .map(feature => {
            if (feature.properties.image) {
              feature = addIconToGeoJson(feature);
              feature.properties.image = calcUrlForImage(feature.properties.image);
            }
            return feature;
          })], []);
    return {
      symbolFeatures: featureCollection(allFeatures.filter(({ geometry: { type } }) => symbolFeatureTypes.includes(type))),
      lineFeatures: featureCollection(allFeatures.filter(({ geometry: { type } }) => lineFeatureTypes.includes(type))),
      fillFeatures: featureCollection(allFeatures.filter(({ geometry: { type } }) => fillFeatureTypes.includes(type))),
    };
  },
);

export const getReportFormSchemaData = createSelector(
  [getReportSchemas],
  ({ schema, uiSchema }) => ({ schema, uiSchema }),
);

const symbolFeatureTypes = ['Point', 'MultiPoint'];
const lineFeatureTypes = ['LineString', 'Polygon', 'MultiLineString', 'MultiPolygon'];
const fillFeatureTypes = ['Polygon', 'MultiPolygon'];