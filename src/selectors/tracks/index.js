import { createSelector } from 'reselect';
import { differenceInCalendarDays, subDays } from 'date-fns';
import uniq from 'lodash/uniq';

import { TRACK_LENGTH_ORIGINS } from '../../ducks/tracks';

import {
  trimTrackDataToTimeRange,
  buildTrackSegments
} from '../../utils/tracks';

const selectEventFilterLowerDateRange = (state) => state.data.eventFilter.filter.date_range.lower;
const selectHeatmapSubjectIDs = (state) => state.view.heatmapSubjectIDs;
const selectIsTimeOfDayColoringActive = (state) => state.view.trackSettings.isTimeOfDayColoringActive;
const selectSubjectTrackState = (state) => state.view.subjectTrackState;
const selectTimeOfDayTimeZone = (state) => state.view.trackSettings.timeOfDayTimeZone;
const selectTimeSliderState = (state) => state.view.timeSliderState;
export const selectTracks = (state) => state.data.tracks;
const selectTrackSettingsLength = (state) => state.view.trackSettings.length;
const selectTrackSettingsOrigin = (state) => state.view.trackSettings.origin;

export const selectTrackLengthInDays = createSelector(
  [selectEventFilterLowerDateRange, selectTrackSettingsLength, selectTrackSettingsOrigin],
  (eventFilterLowerDateRange, trackSettingsLength, trackSettingsOrigin) =>
    // Get the track length in days depending on the origin set in the track settings.
    trackSettingsOrigin === TRACK_LENGTH_ORIGINS.EVENT_FILTER
      ? differenceInCalendarDays(new Date(), new Date(eventFilterLowerDateRange))
      : trackSettingsLength,
);

export const selectTrackTimeEnvelope = createSelector(
  [selectEventFilterLowerDateRange, selectTimeSliderState, selectTrackLengthInDays],
  (eventFilterLowerDateRange, timeSliderState, trackLengthInDays) => {
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
          from: new Date(Math.max(trackLengthStartFromVirtualDate, new Date(eventFilterLowerDateRange))),
          until: new Date(timeSliderState.virtualDate),
        };
      }
      // If the time slider is active but there is no virtual date the envelope is from whatever is more recent, the
      // lower range of the event date filter or the track length start from now, until now.
      return {
        from: new Date(Math.max(trackLengthStartFromNow, new Date(eventFilterLowerDateRange))),
        until: null,
      };
    }
    // If the time slider is not active, the envelope is from the track length start from now until now.
    return { from: trackLengthStartFromNow, until: null };
  });

const selectHeatmapSubjectTracks = createSelector(
  [selectHeatmapSubjectIDs, selectTracks],
  (heatmapSubjectIDs, tracks) => {
    // Calculate the tracks of the heatmap subjects.
    const heatmapSubjectTracks = [];
    heatmapSubjectIDs.forEach((subjectId) => {
      if (tracks[subjectId]) {
        heatmapSubjectTracks.push(tracks[subjectId]);
      }
    });

    return heatmapSubjectTracks;
  }
);

export const selectHeatmapSubjectTracksTrimmedToTrackTimeEnvelope = createSelector(
  [selectHeatmapSubjectTracks, selectTrackTimeEnvelope],
  (heatmapSubjectTracks, trackTimeEnvelope) => heatmapSubjectTracks.map(
    // Trim each heatmap subject tracks to the track time envelope.
    (subjectTracks) => trimTrackDataToTimeRange(subjectTracks, trackTimeEnvelope.from, trackTimeEnvelope.until)
  )
);

const selectSubjectShownTracks = createSelector(
  [selectSubjectTrackState, selectTracks],
  (subjectTrackState, tracks) => {
    // Calculate the tracks of the subjects with shown tracks.
    const subjectTracks = [];
    uniq([...subjectTrackState.pinned, ...subjectTrackState.visible]).forEach((subjectId) => {
      if (tracks[subjectId]) {
        subjectTracks.push(tracks[subjectId]);
      }
    });
    return subjectTracks;
  }
);

/**
 * Subject IDs that currently have tracks visible or pinned (vector or legacy).
 * Use this to drive the track legend and layer filters without requiring fetched GeoJSON.
 */
export const selectSubjectTrackVisibleIds = createSelector(
  [selectSubjectTrackState],
  (subjectTrackState) => uniq([...subjectTrackState.pinned, ...subjectTrackState.visible])
);

const selectSubjectStore = (state) => state.data.subjectStore;

/**
 * Legend item data for subjects with tracks visible/pinned, from subjectStore only.
 * Does not depend on state.data.tracks, so the legend works when tracks are from vector tiles.
 */
export const selectSubjectTrackLegendItemsData = createSelector(
  [selectSubjectTrackVisibleIds, selectSubjectStore],
  (subjectIds, subjectStore) =>
    subjectIds
      .filter((id) => subjectStore[id])
      .map((id) => {
        const subject = subjectStore[id];
        const lastPosition = subject?.last_position;
        const title = lastPosition?.properties?.title ?? lastPosition?.properties?.name ?? subject?.name ?? id;
        const imageUrl = lastPosition?.properties?.image ?? subject?.image_url ?? subject?.last_position?.properties?.image_url;
        return { id, title, imageUrl };
      })
);

export const selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod = createSelector(
  [selectSubjectShownTracks, selectTrackTimeEnvelope, selectIsTimeOfDayColoringActive, selectTimeOfDayTimeZone],
  (subjectShownTracks, trackTimeEnvelope, isTimeOfDayColoringActive, timeOfDayTimeZone) => subjectShownTracks.map(
    (subjectTrack) => {
      // Trim the subject track to the track time envelope.
      const trimmedTrackData = trimTrackDataToTimeRange(
        subjectTrack,
        trackTimeEnvelope.from,
        trackTimeEnvelope.until
      );

      // If the time of day coloring is active, build the track segments.
      return isTimeOfDayColoringActive
        ? {
          ...trimmedTrackData,
          trackSegments: buildTrackSegments(trimmedTrackData.track, timeOfDayTimeZone)
        }
        : trimmedTrackData;
    }
  )
);
