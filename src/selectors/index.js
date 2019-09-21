// reselect explanation and usage https://redux.js.org/recipes/computing-derived-data#connecting-a-selector-to-the-redux-store
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { featureCollection } from '@turf/helpers';
import uniq from 'lodash/uniq';
import isEqual from 'react-fast-compare';

import { createFeatureCollectionFromSubjects, createFeatureCollectionFromEvents, addIconToGeoJson } from '../utils/map';
import { convertArrayOfTracksToPointFeatureCollection } from '../utils/tracks';
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
const hiddenFeatureIDs = ({ view: { hiddenFeatureIDs } }) => hiddenFeatureIDs;
const trackCollection = trackCollection => trackCollection;
const tracks = ({ data: { tracks } }) => tracks;
export const featureSets = ({ data: { featureSets } }) => featureSets;
export const analyzerFeatures = ({ data: { analyzerFeatures } }) => analyzerFeatures;
const subjectTrackState = ({ view: { subjectTrackState } }) => subjectTrackState;
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
  [tracks, subjectTrackState],
  (tracks, subjectTrackState) => {
    const { visible, pinned } = subjectTrackState;
    const trackLayerIDs = uniq([...visible, ...pinned]);

    return trackLayerIDs
      .filter(id => !!tracks[id])
      .map(id => (tracks[id]));
  },
);

// TODO - refactor this and the feature call to share a reduce function
export const getAnalyzerFeatureCollectionsByType = createSelector(
  [analyzerFeatures],
  (analyzerFeatures) => {
    const allAnalyzers = analyzerFeatures.reduce((accumulator, data) =>
      [...accumulator,
      ...data.geojson.features.map(feature => {
        if (feature.properties.image) {
          feature = addIconToGeoJson(feature);
          feature.properties.image = calcUrlForImage(feature.properties.image);
        }
        // assign analyzer type to each feature
        feature.analyzer_type = data.type;
        return feature;
      })], []);
    // simulate layergroups found in old codebase
    const layerGroups = analyzerFeatures.map( (analyzer) => {
      const featureIds = analyzer.geojson.features.map( feature => feature.properties.id);
      return {id: analyzer.id, feature_ids: featureIds};
    });

    console.log('all analyzers', allAnalyzers);
    
    return {
      analyzerWarningLines: featureCollection(allAnalyzers.filter(({ properties: { spatial_group } }) => warningAnalyzerLineTypes.includes(spatial_group))),
      analyzerCriticalLines: featureCollection(allAnalyzers.filter(({ properties: { spatial_group } }) => criticalAnalyzerLineTypes.includes(spatial_group))),
      analyzerWarningPolys: featureCollection(allAnalyzers.filter(({ properties: { spatial_group } }) => warningAnalyzerPolyTypes.includes(spatial_group))),
      analyzerCriticalPolys: featureCollection(allAnalyzers.filter(({ properties: { spatial_group } }) => criticalAnalyzerPolyTypes.includes(spatial_group))),
      layerGroups: layerGroups,
    };
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
  (tracks, heatmapSubjectIDs) => heatmapSubjectIDs
    .filter(id => !!tracks[id])
    .map(id => tracks[id]),
);

export const getHeatmapTrackPoints = createSelector(
  [getArrayOfVisibleHeatmapTracks],
  trackCollection => convertArrayOfTracksToPointFeatureCollection(trackCollection)
);

const symbolFeatureTypes = ['Point', 'MultiPoint'];
const lineFeatureTypes = ['LineString', 'Polygon', 'MultiLineString', 'MultiPolygon'];
const fillFeatureTypes = ['Polygon', 'MultiPolygon'];

const warningAnalyzerLineTypes = ['LineString.warning_group', 'MultiLineString.warning_group'];
const criticalAnalyzerLineTypes = ['LineString.critical_group', 'MultiLineString.critical_group'];
const warningAnalyzerPolyTypes= ['Polygon.warning_group', 'MultiPolygon.warning_group'];
const criticalAnalyzerPolyTypes= ['Polygon.critical_group', 'MultiPolygon.critical_group'];