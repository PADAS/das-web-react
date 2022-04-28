import { createSelector } from 'reselect';

import { DEVELOPMENT_FEATURE_FLAGS } from '../constants';
import { getTimeSliderState } from './';

const { ENABLE_NEW_CLUSTERING } = DEVELOPMENT_FEATURE_FLAGS;

export const getShowReportsOnMap = ({ view: { showReportsOnMap } }) => showReportsOnMap;
const getClusterConfig = ({ view: { mapClusterConfig } }) => mapClusterConfig;

export const getShouldEventsBeClustered = createSelector(
  [getClusterConfig, getShowReportsOnMap, getTimeSliderState],
  (mapClusterConfig, showReportsOnMap, timeSliderState) => ENABLE_NEW_CLUSTERING && !!mapClusterConfig.reports && showReportsOnMap && !timeSliderState.active
);

export const getShouldSubjectsBeClustered = createSelector(
  [getClusterConfig, getTimeSliderState],
  (clusterConfig, timeSliderState) => ENABLE_NEW_CLUSTERING && !!clusterConfig.subjects && !timeSliderState.active
);
