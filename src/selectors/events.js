import { createSelector } from 'reselect';

import { getEventFilterDateRange, getMapEventFeatureCollection, getTimeSliderState } from './';

import { addDistanceFromVirtualDatePropertyToEventFeatureCollection } from '../utils/events';

const getEventTypes = ({ data: { eventTypes } }) => eventTypes;
const getPatrolTypes = ({ data: { patrolTypes } }) => patrolTypes;

export const getMapEventFeatureCollectionWithVirtualDate = createSelector(
  [(...args) => getEventFilterDateRange(...args), (...args) => getMapEventFeatureCollection(...args), (...args) => getTimeSliderState(...args)],
  (eventFilterDateRange, mapEventFeatureCollection, timeSliderState) => {
    const { active: timeSliderActive, virtualDate } = timeSliderState;
    if (!timeSliderActive) return mapEventFeatureCollection;

    const { lower: eventFilterSince, upper: eventFilterUntil } = eventFilterDateRange;
    const eventFilterDateRangeLength = (eventFilterUntil ? new Date(eventFilterUntil) : new Date()) - new Date(eventFilterSince);

    return addDistanceFromVirtualDatePropertyToEventFeatureCollection(
      mapEventFeatureCollection,
      virtualDate,
      eventFilterDateRangeLength,
      true,
    );
  },
);

export const displayEventTypes = createSelector(
  [getEventTypes, getPatrolTypes],
  (eventTypes, patrolTypes) => {
    console.log({ eventTypes, patrolTypes });
    return [...eventTypes, ...patrolTypes];
  }
);