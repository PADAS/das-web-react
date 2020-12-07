import { createSelector } from './';
import { trimmedVisibleTrackData } from './tracks';
import { getLeaderForPatrol } from '../utils/patrols';
import { trimTrackDataToTimeRange } from '../utils/tracks';
import uniq from 'lodash/uniq';

export const getPatrolStore = ({ data: { patrolStore } }) => patrolStore;
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
  (store, patrolIdsToTrack) => {
    return patrolIdsToTrack
      .map((id) => store[id])
      .filter((patrol) => !!patrol && !!getLeaderForPatrol(patrol))
  }
);


export const visibleTrackDataWithPatrolAwareness = createSelector(
  [trimmedVisibleTrackData, getPatrolTrackList],
  (trackData, patrols) => trackData.map((t) => {
    const trackSubjectId = t.track.features[0].properties.id;
    const hasPatrolTrackMatch = patrols.some(p =>
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

export const patrolTrackData = createSelector(
  [visibleTrackDataWithPatrolAwareness, getPatrolTrackList],
  (trackData, patrols) => {
    const tracks = trackData.filter(t => !!t.patrolTrackShown);

    console.log({tracks});
    
    return patrols
      .map((patrol) => {
        const [firstLeg] = patrol.patrol_segments;
        const leader = getLeaderForPatrol(patrol);
        const timeRange = !!firstLeg && firstLeg.time_range;
        const leaderTrack = leader && leader.id && tracks.find(t => t.track.features[0].properties.id);

        return {
          patrol,
          trackData: leaderTrack && timeRange && timeRange.start_time && trimTrackDataToTimeRange(leaderTrack, timeRange.start_time, timeRange.end_time),
        };
      })
      .filter(t => !!t.trackData);
  }
);