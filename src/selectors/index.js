// reselect explanation and usage https://redux.js.org/recipes/computing-derived-data#connecting-a-selector-to-the-redux-store
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { featureCollection } from '@turf/helpers';
import bboxPolygon from '@turf/bbox-polygon';

import { createFeatureCollectionFromSubjects, createFeatureCollectionFromEvents, filterInactiveRadiosFromCollection } from '../utils/map';
import { calcUrlForImage } from '../utils/img';
import { mapReportTypesToCategories } from '../utils/event-types';
import { evaluateFeatureFlag } from '../utils/feature-flags';

import { generatePatrolEventCategory } from '../fixtures/patrol_management';
import { FEATURE_FLAGS } from '../constants';

export const createSelector = createSelectorCreator(
  defaultMemoize,
  // isEqual,
);

const mapEvents = ({ data: { mapEvents: { events } } }) => events;
const mapSubjects = ({ data: { mapSubjects } }) => mapSubjects;
const showInactiveRadios = ({ view: { showInactiveRadios } }) => showInactiveRadios;
const hiddenSubjectIDs = ({ view: { hiddenSubjectIDs } }) => hiddenSubjectIDs;
const feedEvents = ({ data: { feedEvents } }) => feedEvents;
const feedIncidents = ({ data: { feedIncidents } }) => feedIncidents;
const eventStore = ({ data: { eventStore } }) => eventStore;
const hiddenFeatureIDs = ({ view: { hiddenFeatureIDs } }) => hiddenFeatureIDs;
const hiddenAnalyzerIDs = ({ view: { hiddenAnalyzerIDs } }) => hiddenAnalyzerIDs;
const getReportSchemas = ({ data: { eventSchemas } }, { data:report }) => eventSchemas[report.event_type];
const userLocation = ({ view: { userLocation } }) => userLocation;
const showUserLocation = ({ view: { showUserLocation } }) => showUserLocation;
const getLastKnownMapBbox = ({ data: { mapEvents: { bbox } } }) => bbox;

export const analyzerFeatures = ({ data: { analyzerFeatures } }) => analyzerFeatures.data;
export const featureSets = ({ data: { featureSets } }) => featureSets.data;
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

export const bboxBoundsPolygon = createSelector(
  [getLastKnownMapBbox],
  (bbox) => bbox && bboxPolygon(bbox.split(',').map(coord => parseFloat(coord))),
);

const getEventTypes = ({ data: { eventTypes } }) => eventTypes;

const userCreatableEventTypesByCategory = createSelector(
  [getEventTypes],
  (eventTypes) => mapReportTypesToCategories(eventTypes)
    .filter((category) => {
      if (category.flag && category.flag === 'user') {
        return category.permissions.includes('create');
      }
      if (!category.flag) return true;
      return false;
    })
);


export const getMapSubjectFeatureCollection = createSelector(
  [mapSubjects, hiddenSubjectIDs, showInactiveRadios],
  (mapSubjects, hiddenSubjectIDs, showInactiveRadios) => {
    const mapSubjectFeatureCollection = createFeatureCollectionFromSubjects(mapSubjects.filter(item => !hiddenSubjectIDs.includes(item.id)));
    if (showInactiveRadios) return mapSubjectFeatureCollection;
    return filterInactiveRadiosFromCollection(mapSubjectFeatureCollection);
  });

export const getMapEventFeatureCollection = createSelector(
  [mapEvents, eventStore, getEventTypes],
  (mapEvents, eventStore, eventTypes) => createFeatureCollectionFromEvents(mapEvents
    .map(id => eventStore[id])
    .filter(item => !!item), eventTypes)
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
  (categories) => {
    const categoriesWithoutCollections = categories.map(cat => ({
      ...cat,
      types: cat.types.filter(t => !t.is_collection),
    }));

    return [
      ...(evaluateFeatureFlag(FEATURE_FLAGS.PATROL_MANAGEMENT) ? [generatePatrolEventCategory()] : []),
      ...categoriesWithoutCollections
    ];

  },
);

export const reportedBy = createSelector(
  [getEventReporters],
  reporters => reporters,
);

export const getAnalyzerFeatureCollectionsByType = createSelector(
  [analyzerFeatures, hiddenAnalyzerIDs],
  (analyzerFeatures, hiddenAnalyzerIDs) => {
    const allAnalyzers = analyzerFeatures.filter((analyzer) => !hiddenAnalyzerIDs.includes(analyzer.id))
      .reduce((accumulator, data) =>
        [...accumulator,
          ...data.geojson.features.map(feature => {
            feature.analyzer_type = data.type;
            return feature;
          })], []);
    // simulate layergroups found in old codebase by passing the feature ids
    // of the analyzer feature collection so they can be looked up at runtime - 
    // ie when a rollover occurs with a mouse
    const layerGroups = analyzerFeatures.map((analyzer) => {
      const featureIds = analyzer.geojson.features.map(feature => feature.properties.id);
      return { id: analyzer.id, feature_ids: featureIds };
    });

    const analyzerPayload = {
      analyzerWarningLines: featureCollection(allAnalyzers.filter(({ properties: { spatial_group } }) => warningAnalyzerLineTypes.includes(spatial_group))),
      analyzerCriticalLines: featureCollection(allAnalyzers.filter(({ properties: { spatial_group } }) => criticalAnalyzerLineTypes.includes(spatial_group))),
      analyzerWarningPolys: featureCollection(allAnalyzers.filter(({ properties: { spatial_group } }) => warningAnalyzerPolyTypes.includes(spatial_group))),
      analyzerCriticalPolys: featureCollection(allAnalyzers.filter(({ properties: { spatial_group } }) => criticalAnalyzerPolyTypes.includes(spatial_group))),
      layerGroups: layerGroups,
    };

    return analyzerPayload;
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
              feature.properties.image = calcUrlForImage(feature.properties.image);
            }
            return feature;
          })], []);
    return {
      symbolFeatures: featureCollection(
        allFeatures
          .filter(({ geometry: { type } }) => symbolFeatureTypes.includes(type))
      ),
      lineFeatures: featureCollection(
        allFeatures
          .filter(({ geometry: { type } }) =>
            lineFeatureTypes.includes(type)
          )
      ),
      fillFeatures: featureCollection(
        allFeatures
          .filter(({ geometry: { type } }) =>
            fillFeatureTypes.includes(type)
          )
      ),
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

const warningAnalyzerLineTypes = ['LineString.warning_group', 'MultiLineString.warning_group', 'Point.containment_regions_group'];
const criticalAnalyzerLineTypes = ['LineString.critical_group', 'MultiLineString.critical_group'];
const warningAnalyzerPolyTypes = ['Polygon.warning_group', 'MultiPolygon.warning_group', 'Polygon.containment_regions_group', 'Polygon.proximity_group'];
const criticalAnalyzerPolyTypes = ['Polygon.critical_group', 'MultiPolygon.critical_group'];