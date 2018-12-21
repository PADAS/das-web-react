// reselect explanation and usage https://redux.js.org/recipes/computing-derived-data#connecting-a-selector-to-the-redux-store

import { createSelector } from 'reselect';
import { createFeatureCollectionFromSubjects, createFeatureCollectionFromEvents } from '../utils/map';

const mapEvents = ({ mapEvents }) => mapEvents;
const mapSubjects = ({ mapSubjects }) => mapSubjects;

export const getMapEventFeatureCollection = createSelector(
  [mapEvents],
  mapEvents => createFeatureCollectionFromEvents(mapEvents)
);

export const getMapSubjectFeatureCollection = createSelector(
  [mapSubjects],
  mapSubjects => createFeatureCollectionFromSubjects(mapSubjects)
);