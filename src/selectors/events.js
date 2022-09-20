import { createSelector } from 'reselect';

import { getEventFilterDateRange, getMapEventFeatureCollection, getTimeSliderState } from './';

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
