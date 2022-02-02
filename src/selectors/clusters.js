import { createSelector } from 'reselect';

import { getTimeSliderState } from './';

// This is the place to query a redux configuration flag to cluster / uncluster things
export const getShouldEventsBeClustered = createSelector(
  [getTimeSliderState],
  (timeSliderState) => !timeSliderState.active
);

export const getShouldSubjectsBeClustered = createSelector(
  [getTimeSliderState],
  (timeSliderState) => !timeSliderState.active
);
