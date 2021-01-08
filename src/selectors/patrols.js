import { createSelector, createEqualitySelector } from './';
import { getSubjectStore } from './subjects';

import { trimmedVisibleTrackData, trackTimeEnvelope, tracks } from './tracks';
import { getLeaderForPatrol } from '../utils/patrols';
import { trackHasDataWithinTimeRange, trimTrackDataToTimeRange } from '../utils/tracks';
import uniq from 'lodash/uniq';

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

export const assemblePatrolDataForPatrol = (patrol, leader, trackData) => {
  const [firstLeg] = patrol.patrol_segments;
  const timeRange = !!firstLeg && firstLeg.time_range;
  const hasTrackDataWithinPatrolWindow = !!trackData && trackHasDataWithinTimeRange(trackData, timeRange.start_time, timeRange.end_time);

  const trimmed = !!hasTrackDataWithinPatrolWindow && trimTrackDataToTimeRange(trackData, timeRange.start_time, timeRange.end_time);

  return {
    patrol,
    leader,
    trackData: trimmed || null,
  };
};

export const createPatrolDataSelector = () => createEqualitySelector(
  [getPatrolFromProps, getLeaderForPatrolFromProps,  getTrackForPatrolFromProps],
  assemblePatrolDataForPatrol,
);

export const patrolsWithTrackShown = createSelector(
  [getPatrolTrackState, getPatrolStore],
  (patrolTrackState, patrolStore) => patrolTrackState
    .map(id => patrolStore[id])
    .filter(p => !!p)
);


export const visibleTrackedPatrolData = createSelector(
  [tracks, patrolsWithTrackShown, trackTimeEnvelope, getSubjectStore],
  (tracks, patrols, trackTimeEnvelope, subjectStore) => {

    return patrols
      .map((patrol) => {
        const leader = getLeaderForPatrol(patrol, subjectStore);
        const trackData = !!leader && tracks[leader.id];

        return assemblePatrolDataForPatrol(patrol, leader, trackData);
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