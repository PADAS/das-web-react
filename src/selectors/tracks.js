import uniq from 'lodash/uniq';
import startOfDay from 'date-fns/start_of_day';
import subDays from 'date-fns/sub_days';

import { createSelector, getTimeSliderState, getEventFilterDateRange } from './';
import { trimTrackDataToTimeRange } from '../utils/tracks';
import { getPatrolsForSubject } from '../utils/patrols';

const heatmapSubjectIDs = ({ view: { heatmapSubjectIDs } }) => heatmapSubjectIDs;
export const subjectTrackState = ({ view: { subjectTrackState } }) => subjectTrackState;
export const tracks = ({ data: { tracks } }) => tracks;
const trackLength = ({ view: { trackLength } }) => trackLength;
const getPatrols = ({ data: { patrols: { results }} }) => results;

export const getVisibleTrackIds = createSelector(
  [subjectTrackState],
  (subjectTrackState) => uniq([...subjectTrackState.pinned, ...subjectTrackState.visible]),
);

const visibleTrackData = createSelector(
  [tracks, subjectTrackState],
  (tracks, subjectTrackState) => {
    const displayedSubjectTrackIDs = uniq([...subjectTrackState.pinned, ...subjectTrackState.visible]);

    return displayedSubjectTrackIDs
      .filter(id => !!tracks[id])
      .map(id => (tracks[id]));
  },
);

const trackTimeEnvelope = createSelector([trackLength, getTimeSliderState, getEventFilterDateRange], 
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

      const startDate = new Date(Math.max(trackLengthStartDate, new Date(lower)));
      return { from: startDate, until: virtualDate };
    }

    return { from: trackLengthStartDate, until: null };
  });

const makePatrolPoint = (feature, label, coordinates=null) => {
  return {
    ...feature,
    properties: {
      ...feature.properties,
      name: label,
      title: label,
      ticker: 'P',
    },
    geometry: {
      ...feature.geometry,
      coordinates: coordinates || feature.geometry.coordinates
    }
  }
};

export const trimmedVisibleTrackData = createSelector(
  [visibleTrackData, trackTimeEnvelope, getPatrols],
  (trackData, timeEnvelope, patrols) => {
    const { from, until } = timeEnvelope;
    const trimmedTrackData = trackData
    .map(trackData => trimTrackDataToTimeRange(trackData, from, until))
    .map(
      trackData => {
        const { features } = trackData.points;
        const feature = features[0];

        if (!feature) {
          return trackData;
        }
  
        const subject = feature.properties;
        const subjectPatrol = getPatrolsForSubject(patrols, subject)[0];
        
        if (!subjectPatrol) {
          return trackData
        }

        const { start_location, end_location, time_range: { start_time, end_time } } = subjectPatrol.patrol_segments[0];

        let patrol_points = {
          start_location: start_location 
            ? makePatrolPoint(trackData.points.features[0], 'Patrol Start', [start_location.longitude, start_location.latitude])
            : null,
          end_location: end_location
            ? makePatrolPoint(trackData.points.features[0], 'Patrol End', [end_location.longitude, end_location.latitude])
            : null,
        };

        if ([start_location, end_location].includes(null)) {
          trackData.points.features.map(
            (feature) => {
              const { properties: { time } } = feature;

              if (time === start_time) {
                patrol_points.start_location = makePatrolPoint(feature, 'Patrol Start');
              }

              if (time === end_time) {
                patrol_points.end_location = makePatrolPoint(feature, 'Patrol End');
              }
            }
          );
        }

        if (!patrol_points.start_location) {
          const feature = features[0];
          patrol_points.start_location = makePatrolPoint(feature, 'Patrol Start (Est.)');
        }

        if (!patrol_points.end_location) {
          const feature = features[features.length - 1];
          patrol_points.end_location = makePatrolPoint(feature, 'Patrol End (Est.)');
        }

        return {
          ...trackData,
          patrol_points
        }
      }
    );

    return trimmedTrackData
  },
);

const heatmapTrackData = createSelector(
  [tracks, heatmapSubjectIDs],
  (tracks, heatmapSubjectIDs) => heatmapSubjectIDs
    .filter(id => !!tracks[id])
    .map(id => tracks[id]),
);

export const trimmedHeatmapTrackData = createSelector(
  [heatmapTrackData, trackTimeEnvelope],
  (trackData, timeEnvelope) => {
    const { from, until } = timeEnvelope;

    return trackData
      .map(trackData => trimTrackDataToTimeRange(trackData, from, until));
  },
);
