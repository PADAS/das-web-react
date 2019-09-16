import uniq from 'lodash/uniq';
import { featureCollection } from '@turf/helpers';

import { createSelector, getTimeSliderState, getEventFilterDateRange } from './';
import { trimTrackFeatureCollectionToTimeRange, trimTrackFeatureCollectionToLength, convertTrackFeatureCollectionToPoints } from '../utils/tracks';

const heatmapSubjectIDs = ({ view: { heatmapSubjectIDs } }) => heatmapSubjectIDs;
const displayedSubjectTrackIDs = ({ view: { subjectTrackState: { pinned, visible } } }) => uniq([...pinned, ...visible]);
export const tracks = ({ data: { tracks } }) => tracks;
const trackLength = ({ view: { trackLength } }) => trackLength;

const getArrayOfVisibleTracks = createSelector(
  [tracks, displayedSubjectTrackIDs],
  (tracks, displayedSubjectTrackIDs) => {
    return displayedSubjectTrackIDs
      .filter(id => !!tracks[id])
      .map(id => (tracks[id]));
  },
);

export const visibleTrackFeatureCollection = createSelector(
  [getArrayOfVisibleTracks],
  trackArray => featureCollection(trackArray.map(track => track.features[0])),
);

export const trimmedVisibleTrackFeatureCollection = createSelector(
  [visibleTrackFeatureCollection, trackLength, getTimeSliderState, getEventFilterDateRange],
  (visibleTracks, trackLength, timeSliderState, eventFilterDateRange) => {
   
    return trimTracksForLengthAndRange(visibleTracks, trackLength, timeSliderState, eventFilterDateRange);
  },
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

export const trimmedVisibleHeatmapTrackFeatureCollection = createSelector(
  [trimmedVisibleTrackFeatureCollection, heatmapSubjectIDs],
  (mapSubjectTracksFeatureCollection, heatmapSubjectIDs) => ({
    ...mapSubjectTracksFeatureCollection,
    features: mapSubjectTracksFeatureCollection.features.filter(({ properties: { id } }) => heatmapSubjectIDs.includes(id)),
  }),
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