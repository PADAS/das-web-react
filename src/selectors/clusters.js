import { createSelector } from 'reselect';

import { getTimeSliderState } from './';

export const getShowReportsOnMap = ({ view: { showReportsOnMap } }) => showReportsOnMap;

// This is the place to query a redux configuration flag to cluster / uncluster things
export const getShouldEventsBeClustered = createSelector(
  [getShowReportsOnMap, getTimeSliderState],
  (showReportsOnMap, timeSliderState) => !!showReportsOnMap && !timeSliderState.active
);

export const getShouldSubjectsBeClustered = createSelector(
  [getTimeSliderState],
  (timeSliderState) => !timeSliderState.active
);
