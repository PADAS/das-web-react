import uniq from 'lodash/uniq';
import { differenceInCalendarDays, getHours, getMinutes, subDays } from 'date-fns';
import { createSelector } from 'reselect';

import { getTimeSliderState, getEventFilterDateRange } from './';
import { trimTrackDataToTimeRange } from '../utils/tracks';
import { TRACK_LENGTH_ORIGINS } from '../ducks/tracks';

const heatmapSubjectIDs = ({ view: { heatmapSubjectIDs } }) => heatmapSubjectIDs;
export const subjectTrackState = ({ view: { subjectTrackState } }) => subjectTrackState;
export const tracks = ({ data: { tracks } }) => tracks;
const trackLength = ({ view: { trackLength } }) => trackLength;
const getPatrolTrackIds = ({ view: { patrolTrackState }, data: { patrolStore } }) => uniq(
  [...patrolTrackState.visible, ...patrolTrackState.pinned]
    .map(patrolId => patrolStore[patrolId])
    .filter(p => !!p)
    .map(p => !!p.patrol_segments.length && p.patrol_segments[0].leader)
    .filter(l => !!l)
    .map(({ id }) => id),
);

const visibleTrackData = createSelector(
  [tracks, subjectTrackState, getPatrolTrackIds],
  (tracks, subjectTrackState, patrolTrackIds) => {
    const displayedSubjectTrackIDs = uniq([...subjectTrackState.pinned, ...subjectTrackState.visible, ...patrolTrackIds]);

    return displayedSubjectTrackIDs
      .filter(id => !!tracks[id])
      .map(id => (tracks[id]));
  },
);

export const trackTimeEnvelope = createSelector([trackLength, (...args) => getTimeSliderState(...args), (...args) => getEventFilterDateRange(...args) ],
  (trackLength, timeSliderState, eventFilterDateRange) => {
    const { virtualDate, active: timeSliderActive } = timeSliderState;
    const { lower } = eventFilterDateRange;
    const { origin, length } = trackLength;

    const trackLengthDays = origin === TRACK_LENGTH_ORIGINS.eventFilter ?
      differenceInCalendarDays(new Date(), new Date(lower)) : length;


    let trackLengthStartDate = subDays(new Date(), trackLengthDays);


    if (timeSliderActive) {
      if (virtualDate) {
        trackLengthStartDate = subDays(virtualDate, trackLengthDays);
      }

      const startDate = new Date(Math.max(trackLengthStartDate, new Date(lower)));
      return { from: startDate, until: virtualDate };
    }

    return { from: trackLengthStartDate, until: null };
  });

const TIME_OF_DAY_RANGES = {
  0: {
    from: { hour: 12, min: 1 },
    to: { hour: 15, min: 0 }
  },
  1: {
    from: { hour: 15, min: 1 },
    to: { hour: 18, min: 0 }
  },
  2: {
    from: { hour: 18, min: 1 },
    to: { hour: 21, min: 0 }
  },
  3: {
    from: { hour: 21, min: 1 },
    to: { hour: 0, min: 0 }
  },
  4: {
    from: { hour: 0, min: 1 },
    to: { hour: 3, min: 0 }
  },
  5: {
    from: { hour: 3, min: 1 },
    to: { hour: 6, min: 0 }
  },
  6: {
    from: { hour: 6, min: 1 },
    to: { hour: 9, min: 0 }
  },
  7: {
    from: { hour: 9, min: 1 },
    to: { hour: 12, min: 0 }
  },
  8: {
    from: { hour: 12, min: 1 },
    to: { hour: 15, min: 0 }
  },
};

const getTimeOfDayRangeLabel = (key) => {
  const range = TIME_OF_DAY_RANGES[key];
  return `${range.from.hour}: ${range.from.min} - ${range.to.hour}: ${range.to.min}`;
};

const COLORED_TIME_ITEMS = [
  { color: 'titaniumYellow', key: 0, text: getTimeOfDayRangeLabel(0) },
  { color: 'americanYellow', key: 1, text: getTimeOfDayRangeLabel(1) },
  { color: 'fandangoPink', key: 2, text: getTimeOfDayRangeLabel(2) },
  { color: 'purplePlum', key: 3, text: getTimeOfDayRangeLabel(3) },
  { color: 'majorelleBlue', key: 4, text: getTimeOfDayRangeLabel(4) },
  { color: 'lapisLazuli', key: 5, text: getTimeOfDayRangeLabel(5) },
  { color: 'spanishGreen', key: 6, text: getTimeOfDayRangeLabel(6) },
  { color: 'green', key: 7, text: getTimeOfDayRangeLabel(7) },
  { color: 'titaniumYellow', key: 8, text: getTimeOfDayRangeLabel(8) },
];


/* ToDo:
*   - Use a better way to define range id/keys
*   - add refactors
 */
const addNewPropBasedOnTime = (time) => {
  const dateTimeObject = new Date(time);
  const hour = getHours(dateTimeObject);
  const min = getMinutes(dateTimeObject);
  let timeOfDayRange = null;

  for (const [key, range] of Object.entries(TIME_OF_DAY_RANGES)) {
    const { from, to } = range;
    if ( (hour >= from.hour && min >= from.min) && (hour <= to.hour && min <= to.min) ){
      timeOfDayRange = key;
      break;
    }
  }

  return timeOfDayRange;
};

const addTimeLegendSomething = (trackData) => {
  const newTrackData = trackData.map(({ points, ...otherData }) => {
    const { features } = points;
    return {
      ...otherData,
      points: {
        ...points,
        features: features.map(({ properties, ...otherFeatures }) => {
          return {
            ...otherFeatures,
            properties: {
              ...properties,
              newProp: addNewPropBasedOnTime(properties.time)
            }
          };
        })
      }
    };
  });
};

export const trimmedVisibleTrackData = createSelector(
  [visibleTrackData, trackTimeEnvelope],
  (trackData, timeEnvelope) => {
    const { from, until } = timeEnvelope;
    const trimmedTrackData = trackData
      .map(trackData => trimTrackDataToTimeRange(trackData, from, until));

    return trimmedTrackData;
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
