import { createSelector } from './';
import { trimmedVisibleTrackData } from './tracks';
import { getLeaderForPatrol } from '../utils/patrols';
import uniq from 'lodash/uniq';

const getPatrolStore = ({ data: { patrolStore } }) => patrolStore;
const getPatrols = ({ data: { patrols } }) => patrols;
const getPatrolTrackState = ({ view: { patrolTrackState } }) => uniq([...patrolTrackState.visible, ...patrolTrackState.pinned]);

export const getPatrolList = createSelector(
  [getPatrolStore, getPatrols],
  (store, patrols) => ({
    ...patrols,
    results: patrols.results.map(id => store[id]).filter(item => !!item),
  })
);

export const getPatrolTrackList = createSelector(
  [getPatrolStore, getPatrolTrackState],
  (store, patrolIdsToTrack) => patrolIdsToTrack
    .map((id) => store[id])
    .filter((patrol) => {
      if (!patrol) return false;

      const leader = getLeaderForPatrol(patrol);
      return !!leader;
    })
);


export const visibleTrackDataWithPatrolAwareness = createSelector(
  [trimmedVisibleTrackData, getPatrolTrackList],
  (trackData, patrols) => trackData.map((t) => {
    const trackSubjectId = t.track.features[0].properties.id;
    const hasPatrolTrackMatch = patrols.some(p => p.patrol_segments[0].leader.id === trackSubjectId);
    return {
      ...t,
      patrolTrackShown: hasPatrolTrackMatch,
    };
  }),
);