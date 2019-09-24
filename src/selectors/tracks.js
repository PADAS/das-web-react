import uniq from 'lodash/uniq';
import { featureCollection } from '@turf/helpers';
import { startOfDay ,subDays } from 'date-fns';

import { createSelector, getTimeSliderState, getEventFilterDateRange } from './';
import { trimTrackFeatureCollectionToTimeRange, convertTrackFeatureCollectionToPoints } from '../utils/tracks';

const heatmapSubjectIDs = ({ view: { heatmapSubjectIDs } }) => heatmapSubjectIDs;
export const displayedSubjectTrackIDs = ({ view: { subjectTrackState: { pinned, visible } } }) => uniq([...pinned, ...visible]);
export const tracks = ({ data: { tracks } }) => tracks;
const trackLength = ({ view: { trackLength } }) => trackLength;

const getTrackById = ({ data: { tracks } }, { trackId }) => tracks[trackId];

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

export const trimmedTrack = createSelector(
  [getTrackById, trackLength, getTimeSliderState, getEventFilterDateRange],
  (trackFeatureCollection, trackLength, timeSliderState, eventFilterDateRange) => {

    if (!trackFeatureCollection) return null;
   
    return trimTracksForLengthAndRange(trackFeatureCollection, trackLength, timeSliderState, eventFilterDateRange);
  },
);

export const trimmedTrackPoints = createSelector(
  [trimmedTrack],
  (trackFeatureCollection) => trackFeatureCollection ? convertTrackFeatureCollectionToPoints(trackFeatureCollection) : null,
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
  [getArrayOfVisibleHeatmapTracks, trackLength, getTimeSliderState, getEventFilterDateRange],
  (arrayOfHeatmapTracks, trackLength, timeSliderState, eventFilterDateRange) => {
    const heatmapFeatureCollection = featureCollection(arrayOfHeatmapTracks.map(({ features: [track] }) => track));
    
    return trimTracksForLengthAndRange(heatmapFeatureCollection, trackLength, timeSliderState, eventFilterDateRange);
  }, 
);

export const trimmedHeatmapPointFeatureCollection = createSelector(
  [trimmedVisibleHeatmapTrackFeatureCollection],
  trackCollection => convertTrackFeatureCollectionToPoints(trackCollection),
);

const trimTracksForLengthAndRange = (collection, trackLength, timeSliderState, eventFilterDateRange) => {
  const { virtualDate, active:timeSliderActive } = timeSliderState;
  const { lower } = eventFilterDateRange;

  const trackLengthStartDate = startOfDay(
    subDays(new Date(), trackLength.length),
  );

  if (timeSliderActive) {
    const startDate = !!(lower - trackLengthStartDate) ? trackLengthStartDate : lower;

    return trimTrackFeatureCollectionToTimeRange(collection, startDate, virtualDate);

  };

  return trimTrackFeatureCollectionToTimeRange(collection, trackLengthStartDate);
};