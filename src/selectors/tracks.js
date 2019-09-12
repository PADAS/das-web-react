import uniq from 'lodash/uniq';
import { featureCollection } from '@turf/helpers';

import { createSelector, getTimeSliderState, getEventFilterDateRange } from './';
import { trimTrackFeatureCollectionToTimeRange, trimTrackFeatureCollectionToLength, convertTrackFeatureCollectionToPoints } from '../utils/tracks';



const mapSubjects = ({ data: { mapSubjects: { subjects } } }) => subjects;
const heatmapSubjectIDs = ({ view: { heatmapSubjectIDs } }) => heatmapSubjectIDs;
const displayedSubjectTrackIDs = ({ view: { subjectTrackState: { pinned, visible } } }) => uniq([...pinned, ...visible]);
const tracks = ({ data: { tracks } }) => tracks;
const trackLength = ({ view: { trackLength } }) => trackLength;


const getArrayOfVisibleTracks = createSelector(
  [tracks, displayedSubjectTrackIDs],
  (tracks, displayedSubjectTrackIDs) => {
    return displayedSubjectTrackIDs
      .filter(id => !!tracks[id])
      .map(id => (tracks[id]));
  },
);

export const getMapSubjectTracksFeatureCollection = createSelector(
  [tracks, mapSubjects, trackLength, getTimeSliderState, getEventFilterDateRange],
  (tracks, mapSubjects, trackLength, timeSliderState, eventFilterDateRange) => {
    const trackFeatureCollection = featureCollection(
      mapSubjects.map(({ id }) => id)
      .filter(id => !!tracks[id] && tracks[id].features && tracks[id].features.length)
      .map(id => (tracks[id].features[0]))
    );
    return trimTracksForLengthAndRange(trackFeatureCollection, trackLength, timeSliderState, eventFilterDateRange);
  },
);

export const visibleTrackFeatureCollection = createSelector(
  [getArrayOfVisibleTracks],
  trackArray => featureCollection(trackArray.map(track => track.features[0])),
);

export const trimmedVisibleTrackFeatureCollection = createSelector(
  [visibleTrackFeatureCollection, trackLength, getTimeSliderState, getEventFilterDateRange],
  (visibleTrackFeatureCollection, trackLength, timeSliderState, eventFilterDateRange) => trimTracksForLengthAndRange(visibleTrackFeatureCollection, trackLength, timeSliderState, eventFilterDateRange),
);

export const trimmedVisibleTrackPointFeatureCollection = createSelector(
  [trimmedVisibleTrackFeatureCollection],
  (trackFeatureCollection) => convertTrackFeatureCollectionToPoints(trackFeatureCollection),
);

export const getArrayOfVisibleHeatmapTracks = createSelector(
  [tracks, heatmapSubjectIDs],
  (tracks, heatmapSubjectIDs) => heatmapSubjectIDs
    .filter(id => !!tracks[id])
    .map(id => tracks[id]),
);

export const visibleHeatmapTrackFeatureCollection = createSelector(
  [getArrayOfVisibleHeatmapTracks],
  trackArray => featureCollection(trackArray.map(track => track.features[0])),
);

export const trimmedVisibleHeatmapTrackFeatureCollection = createSelector(
  [visibleHeatmapTrackFeatureCollection, trackLength, getTimeSliderState, getEventFilterDateRange],
  (visibleHeatmapTrackFeatureCollection, trackLength, timeSliderState, eventFilterDateRange) => trimTracksForLengthAndRange(visibleHeatmapTrackFeatureCollection, trackLength, timeSliderState, eventFilterDateRange),
);

export const trimmedHeatmapPointFeatureCollection = createSelector(
  [trimmedVisibleHeatmapTrackFeatureCollection],
  trackCollection => convertTrackFeatureCollectionToPoints(trackCollection),
);


const trimTracksForLengthAndRange = (collection, trackLength, timeSliderState, eventFilterDateRange) => {
  const { virtualDate, active:timeSliderActive } = timeSliderState;
  const { lower } = eventFilterDateRange;

  const tracks = timeSliderActive ?
    trimTrackFeatureCollectionToTimeRange(collection, lower, virtualDate)
    : collection;

  return trimTrackFeatureCollectionToLength(tracks, trackLength.length);
};