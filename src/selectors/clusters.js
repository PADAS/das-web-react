import { createSelector } from 'reselect';

import { ENVIRONMENT_FEATURE_FLAGS } from '../constants';
import { getTimeSliderState } from './';

const { ENABLE_NEW_CLUSTERING } = ENVIRONMENT_FEATURE_FLAGS;

export const getShowReportsOnMap = ({ view: { showReportsOnMap } }) => showReportsOnMap;

export const getShouldEventsBeClustered = createSelector(
  [getShowReportsOnMap, getTimeSliderState],
  (showReportsOnMap, timeSliderState) => ENABLE_NEW_CLUSTERING && showReportsOnMap && !timeSliderState.active
);

export const getShouldSubjectsBeClustered = createSelector(
  [getTimeSliderState],
  (timeSliderState) => ENABLE_NEW_CLUSTERING && !timeSliderState.active
);
