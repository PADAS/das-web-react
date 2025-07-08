import { createSelector } from 'reselect';
import intersection from 'lodash/intersection';

import { TRACKING_CONTROL_STATES } from '../constants';

import { getSubjectsWithViewableTrackingDataFromGroups } from '../utils/subjects';


const heatmapSubjectIDs = ({ view: { heatmapSubjectIDs } }) => heatmapSubjectIDs;
const pinnedTrackIDs = ({ view: { subjectTrackState: { pinned } } }) => pinned;
const visibleTrackIDs = ({ view: { subjectTrackState: { visible } } }) => visible;
const tracks = ({ data: { tracks } }) => tracks;
export const visibleTrackingDataSubjectIDsForGroup = (_, props) => getSubjectsWithViewableTrackingDataFromGroups(props).map(s => s.id);

const groupIsFullyHeatmapped = createSelector(
  [heatmapSubjectIDs, visibleTrackingDataSubjectIDsForGroup],
  (heatmapSubjects, eligibleSubjects) =>
    !!eligibleSubjects.length && intersection(eligibleSubjects, heatmapSubjects).length === eligibleSubjects.length,
);

const groupIsPartiallyHeatmapped = createSelector(
  [heatmapSubjectIDs, visibleTrackingDataSubjectIDsForGroup, groupIsFullyHeatmapped],
  (heatmapSubjects, eligibleSubjects, fullyMapped) => !!eligibleSubjects.length && !fullyMapped && !!intersection(eligibleSubjects, heatmapSubjects).length,
);

export const groupTracksFullyPinned = createSelector(
  [pinnedTrackIDs, visibleTrackingDataSubjectIDsForGroup],
  (pinnedSubjects, eligibleSubjects) => !!eligibleSubjects.length && intersection(eligibleSubjects, pinnedSubjects).length === eligibleSubjects.length,
);

export const groupTracksPartiallyPinned = createSelector(
  [pinnedTrackIDs, visibleTrackingDataSubjectIDsForGroup, groupTracksFullyPinned],
  (pinnedSubjects, eligibleSubjects, fullyPinned) => !!eligibleSubjects.length && !fullyPinned && !!intersection(eligibleSubjects, pinnedSubjects).length,
);

export const groupTracksFullyVisible = createSelector(
  [visibleTrackIDs, visibleTrackingDataSubjectIDsForGroup],
  (visibleTracks, eligibleSubjects) =>
    eligibleSubjects.length
    && intersection(eligibleSubjects, visibleTracks).length === eligibleSubjects.length,
);

export const groupTracksPartiallyVisible = createSelector(
  [visibleTrackIDs, groupTracksFullyVisible, visibleTrackingDataSubjectIDsForGroup],
  (visibleTracks, tracksFullyVisible, eligibleSubjects) =>
    eligibleSubjects.length > 0
    && !tracksFullyVisible
    && intersection(eligibleSubjects, visibleTracks).length,
);

export const unloadedSubjectTrackIDs = createSelector(
  [visibleTrackingDataSubjectIDsForGroup, tracks],
  (subjectIDs, tracks) => subjectIDs.filter(id => !tracks[id]),
);

export const groupTrackingDataState = createSelector(
  [
    groupIsFullyHeatmapped,
    groupIsPartiallyHeatmapped,
    groupTracksFullyPinned,
    groupTracksPartiallyPinned,
    groupTracksFullyVisible,
    groupTracksPartiallyVisible,
  ],
  (
    fullyMapped,
    partiallyMapped,
    fullyPinned,
    partiallyPinned,
    fullyVisible,
    partiallyVisible
  ) => {
    const trackState = { heatmap: null, track: null };
    if (fullyMapped) trackState.heatmap = TRACKING_CONTROL_STATES.FULLY_HEATMAPPED;
    else if (partiallyMapped) trackState.heatmap = TRACKING_CONTROL_STATES.PARTIALLY_HEATMAPPED;

    if (fullyPinned) trackState.track = TRACKING_CONTROL_STATES.FULLY_PINNED;
    else if (partiallyPinned) trackState.track = TRACKING_CONTROL_STATES.PARTIALLY_PINNED;
    else if (fullyVisible) trackState.track = TRACKING_CONTROL_STATES.FULLY_VISIBLE;
    else if (partiallyVisible) trackState.track = TRACKING_CONTROL_STATES.PARTIALLY_VISIBLE;

    return trackState;
  },
);
