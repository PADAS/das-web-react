import { createSelector } from 'reselect';

import { getEventFilterDateRange, getMapEventFeatureCollection, getTimeSliderState } from './';
import { VALID_EVENT_GEOMETRY_TYPES } from '../constants';

import centerOfMass from '@turf/center-of-mass';
import { featureCollection } from '@turf/helpers';

import { addDistanceFromVirtualDatePropertyToEventFeatureCollection } from '../utils/events';

export const getMapEventFeatureCollectionWithVirtualDate = createSelector(
  [getEventFilterDateRange, getMapEventFeatureCollection, getTimeSliderState],
  (eventFilterDateRange, mapEventFeatureCollection, timeSliderState) => {
    const { active: timeSliderActive, virtualDate } = timeSliderState;

    if (!timeSliderActive) return mapEventFeatureCollection;

    const { lower: eventFilterSince, upper: eventFilterUntil } = eventFilterDateRange;
    const eventFilterDateRangeLength = (eventFilterUntil ? new Date(eventFilterUntil) : new Date()) - new Date(eventFilterSince);

    return addDistanceFromVirtualDatePropertyToEventFeatureCollection(
      mapEventFeatureCollection,
      virtualDate,
      eventFilterDateRangeLength,
    );
  },
);

export const getMapEventFeatureCollectionByTypeWithVirtualDate = createSelector(
  [getMapEventFeatureCollectionWithVirtualDate],
  (mapEventFeatureCollection = { features: [] }) => {
    const mappedByType = mapEventFeatureCollection.features
      .reduce((accumulator, event) => {
        const { geometry: { type } } = event;
        if (!accumulator[type]) return {
          ...accumulator,
          [type]: featureCollection([event]),
        };

        return {
          ...accumulator,
          [type]: {
            ...accumulator[type],
            features: [...accumulator[type].features, event],
          },
        };
      }, {});

    if (mappedByType[VALID_EVENT_GEOMETRY_TYPES.POLYGON]) {
      mappedByType.PolygonCentersOfMass = featureCollection(
        mappedByType[VALID_EVENT_GEOMETRY_TYPES.POLYGON].features
          .map(feature => centerOfMass(feature, feature.properties ))
      );
    }
    return mappedByType;
  }
);