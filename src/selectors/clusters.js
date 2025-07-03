import { createSelector } from 'reselect';

import { getTimeSliderState } from './';

export const getShowReportsOnMap = ({ data: { mapLayerFilter: { showReportsOnMap } } }) => showReportsOnMap;
const getClusterConfig = ({ view: { mapClusterConfig } }) => mapClusterConfig;

export const getShouldEventsBeClustered = createSelector(
  [getClusterConfig, getShowReportsOnMap, getTimeSliderState],
  (mapClusterConfig, showReportsOnMap, timeSliderState) => !!mapClusterConfig.data.events && showReportsOnMap && !timeSliderState.active
);

export const getShouldSubjectsBeClustered = createSelector(
  [getClusterConfig, getTimeSliderState],
  (clusterConfig, timeSliderState) => !!clusterConfig.data.subjects && !timeSliderState.active
);
