import { createSelector } from './';
import { getLeaderForPatrol } from '../utils/patrols';

const getPatrolStore = ({ data: { patrolStore } }) => patrolStore;
const getPatrols = ({ data: { patrols } }) => patrols;
const getPatrolTrackState = ({ view: { patrolTrackState } }) => patrolTrackState;

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
      const leader = getLeaderForPatrol(patrol);
      return !!leader;
    })
);