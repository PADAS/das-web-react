import { createSelector } from 'reselect';
import { isAfter } from 'date-fns';
import uniq from 'lodash/uniq';

import {
  drawLinesBetweenPatrolTrackAndPatrolPoints,
  extractPatrolPointsFromTrackData,
  patrolStateAllowsTrackDisplay,
} from '../../utils/patrols';
import { selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod } from '../tracks';
import { trackHasDataWithinTimeRange, trimTrackDataToTimeRange } from '../../utils/tracks';

const buildPatrolData = (patrol, timeSliderState, tracks) => {
  // Get the patrol leader from the first patrol segment and its tracks.
  const patrolLeader = patrol.patrol_segments[0].leader || null;
  const patrolLeaderTracks = tracks[patrolLeader?.id] || null;

  // Then calculate the tracks by trimming the patrol leader tracks to the patrol time range.
  const timeRange = patrol.patrol_segments[0].time_range;
  const patrolLeaderTracksTrimmedToPatrolTimeRange = !!patrolLeaderTracks
    && patrolStateAllowsTrackDisplay(patrol)
    && trackHasDataWithinTimeRange(patrolLeaderTracks, timeRange.start_time, timeRange.end_time)
    && trimTrackDataToTimeRange(patrolLeaderTracks, timeRange.start_time, timeRange.end_time);
  const patrolTrackData = patrolLeaderTracksTrimmedToPatrolTimeRange || null;

  // Create the patrol data object with what we have so far.
  const patrolData = { leader: patrolLeader, patrol, trackData: patrolTrackData };

  if (patrolData.trackData) {
    // If the patrol has track data, we now calculate its start and stop geometries. First we extract the patrol
    // points.
    const patrolPoints = extractPatrolPointsFromTrackData(patrolData, patrolLeaderTracks);

    if (patrolPoints) {
      const isTimeSliderActiveWithAVirtualDate = timeSliderState.active && timeSliderState.virtualDate;
      if (isTimeSliderActiveWithAVirtualDate) {
        // Adjust the patrol points to the time slider virtual date.
        const timeSliderVirtualDate = new Date(timeSliderState.virtualDate);

        if (patrolPoints.start_location?.properties?.time) {
          const patrolStartDate = new Date(patrolPoints.start_location.properties.time);
          if (isAfter(patrolStartDate, timeSliderVirtualDate)) {
            delete patrolPoints.start_location;
          }
        }

        if (patrolPoints.end_location?.properties?.time) {
          const patrolEndDate = new Date(patrolPoints.end_location.properties.time);
          if (isTimeSliderActiveWithAVirtualDate && isAfter(patrolEndDate, timeSliderVirtualDate)) {
            delete patrolPoints.end_location;
          }
        }
      }

      if (patrolPoints.start_location || patrolPoints.end_location) {
        // If there are either a start or an end location, we calculate the lines and add the start and stop geometries
        // to the patrol data object.
        patrolData.startStopGeometries = {
          points: patrolPoints,
          lines: drawLinesBetweenPatrolTrackAndPatrolPoints(patrolPoints, patrolData.trackData),
        };
      }
    }
  }

  return patrolData;
};

const selectPatrolsFeed = (state) => state.data.patrolsFeed;
const selectPatrolLeaderSchema = (state) => state.data.patrolLeaderSchema;
const selectPatrolStore = (state) => state.data.patrolStore;
const selectPatrolTrackState = (state) => state.view.patrolTrackState;
const selectSubjectStore = (state) => state.data.subjectStore;
const selectTimeSliderState = (state) => state.view.timeSliderState;
const selectTracks = (state) => state.data.tracks;

const selectPatrolLeaders = createSelector(
  [selectPatrolLeaderSchema],
  (patrolLeaderSchema) => patrolLeaderSchema?.trackedbySchema?.properties?.leader?.enum_ext?.map(
    // Map the patrol leaders from the patrol leader schema.
    (leader) => leader.value
  ) || null
);

const selectVisibleAndPinnedPatrolTracks = createSelector(
  [selectPatrolTrackState],
  (patrolTrackState) => uniq([...patrolTrackState.visible, ...patrolTrackState.pinned])
);

export const selectPatrolData = createSelector(
  [selectTimeSliderState, selectTracks, (_, patrol) => patrol],
  (timeSliderState, tracks, patrol) => buildPatrolData(patrol, timeSliderState, tracks)
);

export const selectPatrolLeadersWithLastPosition = createSelector(
  [selectPatrolLeaders, selectSubjectStore],
  (patrolLeaders, subjectStore) => patrolLeaders ? patrolLeaders.map((patrolLeader) => {
    // Map each patrol leader to its subject.
    const patrolLeaderSubject = subjectStore[patrolLeader.id];
    if (!patrolLeader.last_position
      && !patrolLeader.last_position_status
      && patrolLeaderSubject?.last_position
      && patrolLeaderSubject?.last_position_status) {
      // If the patrol leader misses the last position properties, fill them from the subject object.
      return {
        ...patrolLeader,
        last_position: patrolLeaderSubject.last_position,
        last_position_status: patrolLeaderSubject.last_position_status,
      };
    }
    return patrolLeader;
  }) : null
);

export const selectPatrolsFeedMappedFromStore = createSelector(
  [selectPatrolsFeed, selectPatrolStore],
  (patrolsFeed, patrolStore) => {
    // List the patrols from the feed that are defined in the patrol store.
    const patrolsFeedMappedFromStore = [];
    patrolsFeed.forEach((patrolId) => {
      if (patrolStore[patrolId]) {
        patrolsFeedMappedFromStore.push(patrolStore[patrolId]);
      }
    });

    return patrolsFeedMappedFromStore;
  }
);

export const selectPatrolsWithTracks = createSelector(
  [selectPatrolStore, selectVisibleAndPinnedPatrolTracks],
  (patrolStore, visibleAndPinnedPatrolTracks) => {
    // List the patrols with visible and pinned tracks that are defined in the
    // patrol store and that allow track display.
    const patrolsWithTracks = [];
    visibleAndPinnedPatrolTracks.forEach((patrolId) => {
      if (patrolStore[patrolId] && patrolStateAllowsTrackDisplay(patrolStore[patrolId])) {
        patrolsWithTracks.push(patrolStore[patrolId]);
      }
    });

    return patrolsWithTracks;
  }
);

export const selectPatrolsWithTracksData = createSelector(
  [selectPatrolsWithTracks, selectTimeSliderState, selectTracks],
  (patrolsWithTracks, timeSliderState, tracks) => patrolsWithTracks.map(
    // Build the patrol data for each patrol with tracks.
    (patrol) => buildPatrolData(patrol, timeSliderState, tracks)
  )
);

export const selectSubjectTracksWithPatrolTrackShownFlag = createSelector(
  [selectPatrolsWithTracks, selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod],
  (patrolsWithTracks, subjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod) =>
    subjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod.map((subjectTracks) => {
      const subjectId = subjectTracks.track.features[0].properties.id;
      const isSubjectLeaderOfSomePatrol = patrolsWithTracks.some(
        (patrol) => patrol.patrol_segments?.[0]?.leader?.id && patrol.patrol_segments[0].leader.id === subjectId
      );

      // Map each subject tracks and add the patrolTrackShown flag.
      return { ...subjectTracks, patrolTrackShown: isSubjectLeaderOfSomePatrol };
    }),
);
