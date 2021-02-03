import uniq from 'lodash/uniq';
import isAfter from 'date-fns/is_after';

import { createSelector, createEqualitySelector, getTimeSliderState } from './';
import { getSubjectStore } from './subjects';

import { trimmedVisibleTrackData, tracks } from './tracks';
import { getLeaderForPatrol, extractPatrolPointsFromTrackData, drawLinesBetweenPatrolTrackAndPatrolPoints, patrolStateAllowsTrackDisplay } from '../utils/patrols';
import { trackHasDataWithinTimeRange, trimTrackDataToTimeRange } from '../utils/tracks';

export const getPatrolStore = ({ data: { patrolStore } }) => patrolStore;
const getPatrols = ({ data: { patrols } }) => patrols;
const getPatrolFromProps = (_state, { patrol }) => patrol;
export const getTrackForPatrolFromProps = ({ data: { tracks } }, { patrol }) =>
  !!patrol.patrol_segments 
  && !!patrol.patrol_segments.length 
  && !!patrol.patrol_segments[0].leader
  && tracks[patrol.patrol_segments[0].leader.id];
export const getLeaderForPatrolFromProps = ({ data: { subjectStore } }, { patrol }) => getLeaderForPatrol(patrol, subjectStore);
const getPatrolTrackState = ({ view: { patrolTrackState } }) => uniq([...patrolTrackState.visible, ...patrolTrackState.pinned]);


export const getPatrolList = createSelector(
  [getPatrolStore, getPatrols],
  (store, patrols) => ({
    ...patrols,
    results: patrols.results.map(id => store[id]).filter(item => !!item),
  })
);

export const assemblePatrolDataForPatrol = (patrol, leader, trackData, timeSliderState) => {
  const [firstLeg] = patrol.patrol_segments;
  const timeRange = !!firstLeg && firstLeg.time_range;
  const hasTrackDataWithinPatrolWindow = !!trackData && patrolStateAllowsTrackDisplay(patrol) && trackHasDataWithinTimeRange(trackData, timeRange.start_time, timeRange.end_time);

  const trimmed = !!hasTrackDataWithinPatrolWindow && trimTrackDataToTimeRange(trackData, timeRange.start_time, timeRange.end_time);

  const patrolData = {
    patrol, leader, trackData: trimmed || null,
  };

  return {
    ...patrolData,
    startStopGeometries: patrolData.trackData ? generatePatrolStartStopData(patrolData, trackData, timeSliderState) : null,
  };
};

const generatePatrolStartStopData = (patrolData, rawTrack, timeSliderState) => {
  const points = extractPatrolPointsFromTrackData(patrolData, rawTrack);

  const timeSliderActiveWithVirtualDate = (timeSliderState.active && timeSliderState.virtualDate);

  if (!points) return null;

  if (points.start_location
      && points.start_location.properties.time) {
    const startDate = new Date(points.start_location.properties.time);
    if (timeSliderActiveWithVirtualDate && isAfter(startDate, new Date(timeSliderState.virtualDate))) {
      delete points.start_location;
    }
  }
  if (points.end_location
      && points.end_location.properties.time) {
    const endDate = new Date(points.end_location.properties.time);

    if (timeSliderActiveWithVirtualDate && isAfter(endDate, new Date(timeSliderState.virtualDate))) {
      delete points.end_location;
    }
  }

  if (!points.start_location && !points.end_location) return null;

  const lines = drawLinesBetweenPatrolTrackAndPatrolPoints(points, patrolData.trackData);

  return {
    points,
    lines,
  };
};

export const createPatrolDataSelector = () => createEqualitySelector(
  [getPatrolFromProps, getLeaderForPatrolFromProps,  getTrackForPatrolFromProps, getTimeSliderState],
  assemblePatrolDataForPatrol,
);

export const patrolsWithTrackShown = createSelector(
  [getPatrolTrackState, getPatrolStore],
  (patrolTrackState, patrolStore) => patrolTrackState
    .map(id => patrolStore[id])
    .filter(p => !!p)
    .filter(patrolStateAllowsTrackDisplay)
);


export const visibleTrackedPatrolData = createSelector(
  [tracks, patrolsWithTrackShown, getSubjectStore, getTimeSliderState],
  (tracks, patrols, subjectStore, timeSliderState) => {

    return patrols
      .map((patrol) => {
        const leader = getLeaderForPatrol(patrol, subjectStore);
        const trackData = !!leader && tracks[leader.id];

        return assemblePatrolDataForPatrol(patrol, leader, trackData, timeSliderState);
      });
  }
);

export const visibleTrackDataWithPatrolAwareness = createSelector(
  [trimmedVisibleTrackData, patrolsWithTrackShown],
  (trackData, patrolsWithTrackShown) => trackData.map((t) => {
    const trackSubjectId = t.track.features[0].properties.id;
    const hasPatrolTrackMatch = patrolsWithTrackShown.some(p =>
      p.patrol_segments 
      && !!p.patrol_segments.length 
      && p.patrol_segments[0].leader 
      && p.patrol_segments[0].leader.id === trackSubjectId
    );
    return {
      ...t,
      patrolTrackShown: hasPatrolTrackMatch,
    };
  }),
);


// patrol, trackForPatrol, subjectStore, trackTimeEnvelope