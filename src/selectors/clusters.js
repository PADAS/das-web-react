import { createSelector } from 'reselect';

import { getTimeSliderState } from './';
import { REACT_APP_ENABLE_CLUSTERING } from '../constants';

export const getShowReportsOnMap = ({ view: { showReportsOnMap } }) => showReportsOnMap;

// This is the place to query a redux configuration flag to cluster / uncluster things
export const getShouldEventsBeClustered = createSelector(
  [getShowReportsOnMap, getTimeSliderState],
  (showReportsOnMap, timeSliderState) => REACT_APP_ENABLE_CLUSTERING && showReportsOnMap && !timeSliderState.active
);

export const getShouldSubjectsBeClustered = createSelector(
  [getTimeSliderState],
  (timeSliderState) => REACT_APP_ENABLE_CLUSTERING && !timeSliderState.active
);
