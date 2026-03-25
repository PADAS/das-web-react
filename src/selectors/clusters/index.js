import { createSelector } from 'reselect';

const selectIsEventsMapClusteringEnabled = (state) => state.view.mapClusterConfig.data.events;
const selectIsSubjectsMapClusteringEnabled = (state) => state.view.mapClusterConfig.data.subjects;
const selectIsTimeSliderActive = (state) => state.view.timeSliderState.active;
const selectShowReportsOnMap = (state) => state.data.mapLayerFilter.showReportsOnMap;

export const selectShouldEventsBeClustered = createSelector(
  [selectIsEventsMapClusteringEnabled, selectShowReportsOnMap, selectIsTimeSliderActive],
  (isEventsMapClusteringEnabled, showReportsOnMap, isTimeSliderActive) => isEventsMapClusteringEnabled
    && showReportsOnMap
    && !isTimeSliderActive,
);

export const selectShouldSubjectsBeClustered = createSelector(
  [selectIsSubjectsMapClusteringEnabled, selectIsTimeSliderActive],
  (isSubjectsMapClusteringEnabled, isTimeSliderActive) => isSubjectsMapClusteringEnabled && !isTimeSliderActive,
);
