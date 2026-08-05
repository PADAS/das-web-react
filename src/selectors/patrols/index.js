import { createSelector } from 'reselect';
import { shallowEqual } from 'react-redux';
import { isAfter } from 'date-fns';
import uniq from 'lodash/uniq';

import {
  drawLinesBetweenPatrolTrackAndPatrolPoints,
  extractLegPatrolPoints,
  finalizeCombinedPatrolPoints,
  isSegmentActiveForPatrol,
  patrolStateAllowsTrackDisplay,
} from '../../utils/patrols';
import { selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod } from '../tracks';
import { trackHasDataWithinTimeRange, trimTrackDataToTimeRange } from '../../utils/tracks';

// A leg's track is its own leader's track, bounded to that leg's own start/end
// times.
const buildLegTrackData = (segment, tracks) => {
  const leader = segment.leader || null;
  const rawTrackData = leader ? (tracks[leader.id] || null) : null;
  const { start_time, end_time } = segment.time_range || {};

  const trackData = (!!rawTrackData
    && !!start_time
    && trackHasDataWithinTimeRange(rawTrackData, start_time, end_time)
    && trimTrackDataToTimeRange(rawTrackData, start_time, end_time)) || null;

  return { leader, rawTrackData, segment, trackData };
};

// Combines every leg's own track into the patrol's overall track.
const combineLegsTrackData = (legsData) => {
  const legsWithTrackData = [...legsData].reverse().filter(({ trackData }) => !!trackData);

  if (legsWithTrackData.length) {
    return {
      points: {
        type: 'FeatureCollection',
        features: legsWithTrackData.flatMap(({ trackData }) => trackData.points?.features ?? []),
      },
      track: {
        type: 'FeatureCollection',
        features: legsWithTrackData.flatMap(({ trackData }) => trackData.track?.features ?? []),
      },
    };
  }
  return null;
};

const buildPatrolData = (patrol, timeSliderState, tracks) => {
  // The last leg's leader is used for title/display purposes, since it's the
  // most recent one.
  const patrolLeader = patrol.patrol_segments[patrol.patrol_segments.length - 1]?.leader || null;

  if (!patrolStateAllowsTrackDisplay(patrol)) {
    return { leader: patrolLeader, legsTrackData: [], trackData: null };
  }

  const legsData = patrol.patrol_segments.map((segment) => buildLegTrackData(segment, tracks));
  const trackData = combineLegsTrackData(legsData);

  // Create the patrol data object with what we have so far.
  const patrolData = {
    leader: patrolLeader,
    legsTrackData: legsData.map(({ trackData: legTrackData }) => legTrackData),
    trackData,
  };

  if (patrolData.trackData) {
    // If the patrol has track data, we now calculate its start and stop geometries.
    const legsPoints = legsData.map(({ leader: legLeader, rawTrackData, segment, trackData: legTrackData }) => (legTrackData
      ? extractLegPatrolPoints(segment, legLeader, legTrackData, rawTrackData, isSegmentActiveForPatrol(patrol, segment))
      : null));

    const patrolPoints = {
      start_location: legsPoints.find((legPoints) => !!legPoints?.start_location)?.start_location ?? null,
      end_location: [...legsPoints].reverse().find((legPoints) => !!legPoints?.end_location)?.end_location ?? null,
    };

    if (patrolPoints.start_location || patrolPoints.end_location) {
      const isTimeSliderActiveWithAVirtualDate = timeSliderState.active && timeSliderState.virtualDate;
      if (isTimeSliderActiveWithAVirtualDate) {
        // Adjust the patrol points to the time slider virtual date.
        const timeSliderVirtualDate = new Date(timeSliderState.virtualDate);

        if (patrolPoints.start_location?.properties?.time) {
          const patrolStartDate = new Date(patrolPoints.start_location.properties.time);
          if (isAfter(patrolStartDate, timeSliderVirtualDate)) {
            patrolPoints.start_location = null;
          }
        }

        if (patrolPoints.end_location?.properties?.time) {
          const patrolEndDate = new Date(patrolPoints.end_location.properties.time);
          if (isTimeSliderActiveWithAVirtualDate && isAfter(patrolEndDate, timeSliderVirtualDate)) {
            patrolPoints.end_location = null;
          }
        }
      }

      if (patrolPoints.start_location || patrolPoints.end_location) {
        // If there are either a start or an end location, we calculate the lines and add the start and stop geometries
        // to the patrol data object.
        const finalizedPatrolPoints = finalizeCombinedPatrolPoints(patrol, patrolPoints);

        patrolData.startStopGeometries = {
          points: finalizedPatrolPoints,
          lines: drawLinesBetweenPatrolTrackAndPatrolPoints(finalizedPatrolPoints, patrolData.trackData),
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

// Only the tracks belonging to this patrol's own segment leaders, so a socket update to some
// other subject's track elsewhere in the app doesn't invalidate this patrol's (comparatively
// expensive) segment-trimming work below.
const selectPatrolSegmentLeaderTracks = createSelector(
  [selectTracks, (_, patrol) => patrol],
  (tracks, patrol) => patrol.patrol_segments.reduce((segmentLeaderTracks, { leader }) => {
    if (tracks[leader?.id]) {
      segmentLeaderTracks[leader.id] = tracks[leader.id];
    }
    return segmentLeaderTracks;
  }, {}),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
);

export const selectPatrolTrackData = createSelector(
  [selectTimeSliderState, selectPatrolSegmentLeaderTracks, (_, patrol) => patrol],
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
    (patrol) => ({ patrol, ...buildPatrolData(patrol, timeSliderState, tracks) })
  )
);

export const selectSubjectTracksWithPatrolTrackShownFlag = createSelector(
  [selectPatrolsWithTracks, selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod],
  (patrolsWithTracks, subjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod) =>
    subjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod.map((subjectTracks) => {
      const subjectId = subjectTracks.track.features[0].properties.id;
      const isSubjectLeaderOfSomePatrol = patrolsWithTracks.some(
        (patrol) => patrol.patrol_segments?.some((segment) => segment.leader?.id === subjectId)
      );

      // Map each subject tracks and add the patrolTrackShown flag.
      return { ...subjectTracks, patrolTrackShown: isSubjectLeaderOfSomePatrol };
    }),
);
