// reselect explanation and usage https://redux.js.org/recipes/computing-derived-data#connecting-a-selector-to-the-redux-store

import { createSelector } from 'reselect';
import { createFeatureCollectionFromSubjects, createFeatureCollectionFromEvents } from '../utils/map';
import { convertTrackLineStringToPoints } from '../utils/tracks';
import { featureCollection } from '@turf/helpers';

const mapEvents = ({ mapEvents }) => mapEvents;
const mapSubjects = ({ data: { mapSubjects } }) => mapSubjects;
const hiddenSubjectIDs = ({ view: { hiddenSubjectIDs } }) => hiddenSubjectIDs;
const trackCollection = trackCollection => trackCollection;

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