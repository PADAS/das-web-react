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
  (store, patrolTrackIds) => {
    const asEntries = Object.entries(store);

    const toTrack = asEntries.filter(([_key, value]) => {
      const leader = getLeaderForPatrol(value);
      return leader && patrolTrackIds.includes(leader.id);
    }).map(([, value]) => value);
    return toTrack;
  },
);