// reselect explanation and usage https://redux.js.org/recipes/computing-derived-data#connecting-a-selector-to-the-redux-store
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { featureCollection } from '@turf/helpers';
import uniq from 'lodash/uniq';
import isEqual from 'react-fast-compare';

import { createFeatureCollectionFromSubjects, createFeatureCollectionFromEvents, addIconToGeoJson } from '../utils/map';
import { convertArrayOfTracksToPointFeatureCollection, trimTrackFeatureCollectionToLength } from '../utils/tracks';
import { calcUrlForImage } from '../utils/img';
import { getUniqueSubjectGroupSubjects } from '../utils/subjects';
import { mapReportTypesToCategories } from '../utils/event-types';

export const createSelector = createSelectorCreator(
  defaultMemoize,
  isEqual,
);

const mapEvents = ({ data: { mapEvents: { events } } }) => events;
const feedEvents = ({ data: { feedEvents } }) => feedEvents;
const feedIncidents = ({ data: { feedIncidents } }) => feedIncidents;
const eventStore = ({ data: { eventStore } }) => eventStore;
const mapSubjects = ({ data: { mapSubjects: { subjects } } }) => subjects;
const hiddenSubjectIDs = ({ view: { hiddenSubjectIDs } }) => hiddenSubjectIDs;
const heatmapSubjectIDs = ({ view: { heatmapSubjectIDs } }) => heatmapSubjectIDs;
const displayedSubjectTrackIDs = ({ view: { subjectTrackState: { pinned, visible } } }) => uniq([...pinned, ...visible]);
const hiddenFeatureIDs = ({ view: { hiddenFeatureIDs } }) => hiddenFeatureIDs;
const tracks = ({ data: { tracks } }) => tracks;
const trackLength = ({ view: { trackLength } }) => trackLength;
export const featureSets = ({ data: { featureSets } }) => featureSets;
const getReportSchemas = ({ data: { eventSchemas } }, { report }) => eventSchemas[report.event_type];
const getSubjectGroups = ({ data: { subjectGroups } }) => subjectGroups;
const userLocation = ({ view: { userLocation } }) => userLocation;
const showUserLocation = ({ view: { showUserLocation } }) => showUserLocation;
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

export const getMapSubjectFeatureCollection = createSelector(
  [mapSubjects, hiddenSubjectIDs],
  (mapSubjects, hiddenSubjectIDs) => createFeatureCollectionFromSubjects(mapSubjects.filter(item => !hiddenSubjectIDs.includes(item.id)))
);

export const removePersistKey = createSelector(
  [data => data],
  data => {
    const clone = { ...data };
    delete clone._persist;
    return clone;
  },
);

export const allSubjects = createSelector(
  [getSubjectGroups],
  subjectGroups => getUniqueSubjectGroupSubjects(...subjectGroups),
);

export const reportedBy = createSelector(
  [getEventReporters],
  reporters => reporters,
);

export const getArrayOfVisibleTracks = createSelector(
  [tracks, displayedSubjectTrackIDs],
  (tracks, displayedSubjectTrackIDs) => {
    return displayedSubjectTrackIDs
      .filter(id => !!tracks[id])
      .map(id => (tracks[id]));
  },
);

export const visibleTrackFeatureCollection = createSelector(
  [getArrayOfVisibleTracks],
  trackArray => featureCollection(trackArray.map(track => track.features[0])),
);

export const trimmedVisibleTrackFeatureCollection = createSelector(
  [visibleTrackFeatureCollection, trackLength],
  (trackFeatureCollection, trackLength) => trimTrackFeatureCollectionToLength(trackFeatureCollection, trackLength.length),
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

export const getArrayOfVisibleHeatmapTracks = createSelector(
  [tracks, heatmapSubjectIDs],
  (tracks, heatmapSubjectIDs) => heatmapSubjectIDs
    .filter(id => !!tracks[id])
    .map(id => tracks[id]),
);

export const getHeatmapTrackPoints = createSelector(
  [getArrayOfVisibleHeatmapTracks],
  trackCollection => convertArrayOfTracksToPointFeatureCollection(trackCollection)
);

export const getArrayOfDisplayedSubjectTracks = createSelector(
  [tracks, displayedSubjectTrackIDs],
  (tracks, ids) => ids
    .filter(id => !!tracks[id])
    .map(id => tracks[id]),
);

export const getDisplayedSubjectTrackPoints = createSelector(
  [getArrayOfDisplayedSubjectTracks],
  trackCollection => convertArrayOfTracksToPointFeatureCollection(trackCollection),
);

const symbolFeatureTypes = ['Point', 'MultiPoint'];
const lineFeatureTypes = ['LineString', 'Polygon', 'MultiLineString', 'MultiPolygon'];
const fillFeatureTypes = ['Polygon', 'MultiPolygon'];