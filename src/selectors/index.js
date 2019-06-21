// reselect explanation and usage https://redux.js.org/recipes/computing-derived-data#connecting-a-selector-to-the-redux-store
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { featureCollection } from '@turf/helpers';
import uniq from 'lodash/uniq';
import isEqual from 'react-fast-compare';

import { createFeatureCollectionFromSubjects, createFeatureCollectionFromEvents, addIconToGeoJson } from '../utils/map';
import { convertTrackLineStringToPoints } from '../utils/tracks';
import { calcUrlForImage } from '../utils/img';
import { getUniqueSubjectGroupSubjects } from '../utils/subjects';
import { mapReportTypesToCategories } from '../utils/event-types';

export const createSelector = createSelectorCreator(
  defaultMemoize,
  isEqual,
);

const mapEvents = ({ data: { mapEvents } }) => mapEvents;
const mapSubjects = ({ data: { mapSubjects } }) => mapSubjects;
const hiddenSubjectIDs = ({ view: { hiddenSubjectIDs } }) => hiddenSubjectIDs;
const heatmapSubjectIDs = ({ view: { heatmapSubjectIDs } }) => heatmapSubjectIDs;
const hiddenFeatureIDs = ({ view: { hiddenFeatureIDs } }) => hiddenFeatureIDs;
const trackCollection = trackCollection => trackCollection;
const tracks = ({ data: { tracks } }) => tracks;
export const featureSets = ({ data: { featureSets } }) => featureSets;
const subjectTrackState = ({ view: { subjectTrackState } }) => subjectTrackState;
const getReportSchemas = ({ data: { eventSchemas } }, { report }) => eventSchemas[report.event_type];
const getSubjectGroups = ({ data: { subjectGroups } }) => subjectGroups;
const getEventReporters = ({ data: { eventSchemas } }) => eventSchemas.globalSchema
  ? eventSchemas.globalSchema.properties.reported_by.enum_ext
    .map(({ value }) => value)
  : [];

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
  [mapEvents],
  mapEvents => createFeatureCollectionFromEvents(mapEvents)
);

export const getUserCreatableEventTypesByCategory = createSelector(
  [userCreatableEventTypesByCategory],
  categories => categories,
);

export const getMapSubjectFeatureCollection = createSelector(
  [mapSubjects, hiddenSubjectIDs],
  (mapSubjects, hiddenSubjectIDs) => createFeatureCollectionFromSubjects(mapSubjects.filter(item => !hiddenSubjectIDs.includes(item.id)))
);

export const getTrackPointsFromTrackFeatureArray = createSelector(
  [trackCollection],
  trackCollection => trackCollection
    .map(tracks => convertTrackLineStringToPoints(tracks))
    .reduce((accumulator, featureCollection) => {
      return {
        ...accumulator,
        features: [...accumulator.features, ...featureCollection.features],
      };
    }, featureCollection([])),
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
  [tracks, subjectTrackState],
  (tracks, subjectTrackState) => {
    const { visible, pinned } = subjectTrackState;
    const trackLayerIDs = uniq([...visible, ...pinned]);

    return trackLayerIDs
      .filter(id => !!tracks[id])
      .map(id => (tracks[id]));
  },
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
  (tracks, heatmapSubjectIDs) => heatmapSubjectIDs.filter(id => !!tracks[id]).map(id => tracks[id]),
);

export const getHeatmapTrackPoints = createSelector(
  [getArrayOfVisibleHeatmapTracks],
  tracks => getTrackPointsFromTrackFeatureArray(tracks),
);

const symbolFeatureTypes = ['Point', 'MultiPoint'];
const lineFeatureTypes = ['LineString', 'Polygon', 'MultiLineString', 'MultiPolygon'];
const fillFeatureTypes = ['Polygon', 'MultiPolygon'];