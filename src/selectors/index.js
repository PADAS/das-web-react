// reselect explanation and usage https://redux.js.org/recipes/computing-derived-data#connecting-a-selector-to-the-redux-store

import { createSelector } from 'reselect';
import { featureCollection } from '@turf/helpers';
import uniq from 'lodash/uniq';

import { createFeatureCollectionFromSubjects, createFeatureCollectionFromEvents, addIconToGeoJson } from '../utils/map';
import { convertTrackLineStringToPoints } from '../utils/tracks';
import { calcUrlForImage } from '../utils/img';

const mapEvents = ({ mapEvents }) => mapEvents;
const mapSubjects = ({ data: { mapSubjects } }) => mapSubjects;
const hiddenSubjectIDs = ({ view: { hiddenSubjectIDs } }) => hiddenSubjectIDs;
const heatmapSubjectIDs = ({ view: { heatmapSubjectIDs } }) => heatmapSubjectIDs;
const trackCollection = trackCollection => trackCollection;
const tracks = ({ data: { tracks } }) => tracks;
const featureSets = ({ data: { featureSets } }) => featureSets;
const subjectTrackState = ({ view: { subjectTrackState } }) => subjectTrackState;

export const getMapEventFeatureCollection = createSelector(
  [mapEvents],
  mapEvents => createFeatureCollectionFromEvents(mapEvents)
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

export const getFeatureSetGeoJSON = createSelector(
  [featureSets],
  (featureSets) => {
    const allFeatures = featureSets.reduce((accumulator, data) => [...accumulator, ...data.geojson.features.map(feature => {
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