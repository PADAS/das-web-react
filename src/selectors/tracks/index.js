import { createSelector } from 'reselect';
import { differenceInCalendarDays, subDays } from 'date-fns';
import uniq from 'lodash/uniq';

import { TRACK_LENGTH_ORIGINS } from '../../ducks/tracks';

import {
  trimTrackDataToTimeRange,
  buildTimeOfDayFeatureCollection
} from '../../utils/tracks';

const selectEventFilter = (state) => state.data.eventFilter;
const selectHeatmapSubjectIDs = (state) => state.view.heatmapSubjectIDs;
const selectPatrolStore = (state) => state.data.patrolStore;
const selectPatrolTrackState = (state) => state.view.patrolTrackState;
const selectSubjectTrackState = (state) => state.view.subjectTrackState;
const selectTimeSliderState = (state) => state.view.timeSliderState;
export const selectTrackSettings = (state) => state.view.trackSettings;
const selectTracks = (state) => state.data.tracks;

export const selectTrackTimeEnvelope = createSelector([selectEventFilter, selectTimeSliderState, selectTrackSettings],
  (eventFilter, timeSliderState, trackSettings) => {
    // Get the track length in days depending on the origin set in the track settings.
    const trackLengthInDays = trackSettings.origin === TRACK_LENGTH_ORIGINS.EVENT_FILTER
      ? differenceInCalendarDays(new Date(), new Date(eventFilter.filter.date_range.lower))
      : trackSettings.length;

    // Substract the days of the track length from now to get the start date.
    const trackLengthStartFromNow = subDays(new Date(), trackLengthInDays);
    if (timeSliderState.active) {
      if (timeSliderState.virtualDate) {
        // If the time slider is active with a virtual date we substract the days of the track length from the virtual
        // date.
        const trackLengthStartFromVirtualDate = subDays(timeSliderState.virtualDate, trackLengthInDays);
        // The envelope is from whatever is more recent, the lower range of the event date filter or the track length
        // start from the virtual date, until the virtual date.
        return {
          from: new Date(Math.max(trackLengthStartFromVirtualDate, new Date(eventFilter.filter.date_range.lower))),
          until: timeSliderState.virtualDate,
        };
      }
      // If the time slider is active but there is no virtual date the envelope is from whatever is more recent, the
      // lower range of the event date filter or the track length start from now, until now.
      return {
        from: new Date(Math.max(trackLengthStartFromNow, new Date(eventFilter.filter.date_range.lower))),
        until: null,
      };
    }
    // If the time slider is not active, the envelope is from the track length start from now until now.
    return { from: trackLengthStartFromNow, until: null };
  });

const selectHeatmapSubjectTracks = createSelector(
  [selectHeatmapSubjectIDs, selectTracks],
  (heatmapSubjectIDs, tracks) => heatmapSubjectIDs
    // Filter the heatmap subject ids that have tracks.
    .filter((subjectId) => !!tracks[subjectId])
    // Return the tracks of each heatmap subject.
    .map((subjectId) => tracks[subjectId])
);

export const selectHeatmapSubjectTracksTrimmedToTrackTimeEnvelope = createSelector(
  [selectHeatmapSubjectTracks, selectTrackTimeEnvelope],
  (heatmapSubjectTracks, trackTimeEnvelope) => heatmapSubjectTracks.map(
    // Trim each heatmap subject tracks to the track time envelope.
    (subjectTracks) => trimTrackDataToTimeRange(subjectTracks, trackTimeEnvelope.from, trackTimeEnvelope.until)
  )
);

const selectPatrolTracksLeaderIds = createSelector(
  [selectPatrolStore, selectPatrolTrackState],
  (patrolStore, patrolTrackState) => [...patrolTrackState.visible, ...patrolTrackState.pinned]
    // List the patrols that have visible or pinned tracks from the store.
    .map((patrolId) => patrolStore[patrolId])
    // Filter the defined patrols.
    .filter((patrol) => !!patrol)
    // Get the leader of each patrol.
    .map((patrol) => patrol.patrol_segments.length > 0 && patrol.patrol_segments[0].leader)
    // Filter the defined leaders.
    .filter((patrolLeader) => !!patrolLeader)
    // Return the list of leader ids.
    .map((patrolLeader) => patrolLeader.id)
);

const selectSubjectTracks = createSelector(
  [selectPatrolTracksLeaderIds, selectSubjectTrackState, selectTracks],
  (patrolTracksLeaderIds, subjectTrackState, tracks) => uniq([
    ...subjectTrackState.pinned,
    ...subjectTrackState.visible,
    ...patrolTracksLeaderIds,
  ])
    // Filter the defined subject ids.
    .filter((subjectId) => !!tracks[subjectId])
    // Return the tracks of each subject.
    .map((subjectId) => tracks[subjectId])
);


export const selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod = createSelector(
  [selectSubjectTracks, selectTrackTimeEnvelope, selectTrackSettings],
  (subjectTracks, trackTimeEnvelope, { timeOfDayTimeZone, isTimeOfDayColoringActive }) => subjectTracks.map(
    (subjectTrack) => {
      const trimmedTrackData = trimTrackDataToTimeRange( // Trim each subject tracks to the track time envelope.
        subjectTrack,
        trackTimeEnvelope.from,
        trackTimeEnvelope.until
      );

      return isTimeOfDayColoringActive
        ? {
          ...trimmedTrackData,
          timeOfDayFeatureCollection: buildTimeOfDayFeatureCollection(trimmedTrackData.track, timeOfDayTimeZone)
        }
        : trimmedTrackData;
    }
  )
);
