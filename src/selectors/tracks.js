import uniq from 'lodash/uniq';
import { featureCollection } from '@turf/helpers';
import booleanDisjoint from '@turf/boolean-disjoint';
import startOfDay from 'date-fns/start_of_day';
import subDays from 'date-fns/sub_days';

import { createSelector, getTimeSliderState, getEventFilterDateRange, bboxBoundsPolygon } from './';
import { trimTrackDataToTimeRange, convertTrackFeatureCollectionToPoints } from '../utils/tracks';

const heatmapSubjectIDs = ({ view: { heatmapSubjectIDs } }) => heatmapSubjectIDs;
export const subjectTrackState = ({ view: { subjectTrackState } }) => subjectTrackState;
export const tracks = ({ data: { tracks } }) => tracks;
const trackLength = ({ view: { trackLength } }) => trackLength;

const getTrackById = ({ data: { tracks } }, { trackId }) => tracks[trackId].track;

const visibleTracks = createSelector(
  [tracks, subjectTrackState],
  (tracks, subjectTrackState) => {
    const displayedSubjectTrackIDs = uniq([...subjectTrackState.pinned, ...subjectTrackState.visible]);

    return displayedSubjectTrackIDs
      .filter(id => !!tracks[id])
      .map(id => (tracks[id]));
  },
);

const calcTrackTimeEnvelope = createSelector([trackLength, getTimeSliderState, getEventFilterDateRange], 
  (trackLength, timeSliderState, eventFilterDateRange) => {
    const { virtualDate, active:timeSliderActive } = timeSliderState;
    const { lower } = eventFilterDateRange;

    let trackLengthStartDate = startOfDay(
      subDays(new Date(), trackLength.length),
    );

    if (timeSliderActive) {
      if (virtualDate) {
        trackLengthStartDate = virtualDate ? subDays(virtualDate, trackLength.length) : trackLengthStartDate;
      }

      const startDate = !!(trackLengthStartDate - new Date(lower)) ? trackLengthStartDate : new Date(lower);
      return { from: startDate, until: virtualDate };
    }

    return { from: trackLengthStartDate, until: null };
  });

const trimmedVisibleTrackData = createSelector(
  [visibleTracks, calcTrackTimeEnvelope],
  (visibleTracks, timeEnvelope) => {
    const { from, until } = timeEnvelope;

    return visibleTracks
      .map(trackData => trimTrackDataToTimeRange(trackData, from, until));
    // return trimTracksForLengthAndRange(visibleTracks, trackLength, timeSliderState, eventFilterDateRange);
  },
);

export const trimmedVisibleTrackFeatureCollection = createSelector(
  [trimmedVisibleTrackData],
  (trimmedVisibleTrackData) => {

    return featureCollection(
      trimmedVisibleTrackData
        .map(data =>
          data.track.features[0]
        )
    );
  },
);

export const trimmedVisibleTrackPointFeatureCollection = createSelector(
  [trimmedVisibleTrackData],
  (trimmedVisibleTrackData) => {
    return featureCollection(trimmedVisibleTrackData
      .reduce((accumulator, data) => [...accumulator, ...data.points.features], []));
  },
);

export const getTrackWhichCrossesCurrentMapViewById = createSelector(
  [getTrackById, bboxBoundsPolygon],
  (track, bboxPolygon) => {
    if (!track) return null;
    if (!bboxPolygon) return track;

    const doesIntersect = !booleanDisjoint(track, bboxPolygon);
    return doesIntersect && track;
  },
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

  let trackLengthStartDate = startOfDay(
    subDays(new Date(), trackLength.length),
  );

  if (timeSliderActive) {
    if (virtualDate) {
      trackLengthStartDate = virtualDate ? subDays(virtualDate, trackLength.length) : trackLengthStartDate;
    }

    const startDate = !!(trackLengthStartDate - new Date(lower)) ? trackLengthStartDate : new Date(lower);
    return trimTrackDataToTimeRange(collection, startDate, virtualDate);
  }

  return trimTrackDataToTimeRange(collection, trackLengthStartDate);
};

