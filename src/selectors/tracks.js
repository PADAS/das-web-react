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

export const trimmedVisibleTrackData = createSelector(
  [visibleTrackData, trackTimeEnvelope, getPatrols],
  (trackData, timeEnvelope, patrols) => {
    const { from, until } = timeEnvelope;
    const trimmedTrackData = trackData
    .map(trackData => trimTrackDataToTimeRange(trackData, from, until))
    .map(
      trackData => {
        const { features } = trackData.points;
        const subject = features[0].properties;
        const subjectPatrol = getPatrolsForSubject(patrols, subject)[0];
        
        if (!subjectPatrol) {
          return trackData
        }

        const { start_location, end_location, time_range: { start_time, end_time } } = subjectPatrol.patrol_segments[0];

        let patrol_points = {
          start_location: {
            latitude: start_location ? parseFloat(start_location[1]) : null,
            longitude: start_location ? parseFloat(start_location[0]) : null,
            is_estimate: false
          },
          end_location: {
            latitude: end_location ? parseFloat(end_location[1]) : null,
            longitude: end_location ? parseFloat(end_location[0]) : null,
            is_estimate: false
          }
        };

        if ([start_location, end_location].includes(null)) {
          trackData.points.features.map(
            (feature) => {
              const { geometry: { coordinates }, properties: subject } = feature;

              if (subject.time === start_time) {
                patrol_points.start_location = {
                  longitude: parseFloat(coordinates[0]),
                  latitude: parseFloat(coordinates[1])
                }
              }

              if (subject.time === end_time) {
                patrol_points.end_location = {
                  longitude: parseFloat(coordinates[0]),
                  latitude: parseFloat(coordinates[1])
                }
              }
            }
          );
        }

        if (!patrol_points.start_location.longitude) {
          let coordinates = features[0].geometry.coordinates;
          patrol_points.start_location = {
            longitude: parseFloat(coordinates[0]),
            latitude: parseFloat(coordinates[1]),
            is_estimate: true,
          }
        }

        if (!patrol_points.end_location.longitude) {
          let coordinates = features[features.length - 1].geometry.coordinates;
          patrol_points.end_location = {
            longitude: parseFloat(coordinates[0]),
            latitude: parseFloat(coordinates[1]),
            is_estimate: true,
          }
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
