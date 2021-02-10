import uniq from 'lodash/uniq';
import startOfDay from 'date-fns/start_of_day';
import subDays from 'date-fns/sub_days';
import differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

import { createSelector, getTimeSliderState, getEventFilterDateRange } from './';
import { trimTrackDataToTimeRange } from '../utils/tracks';
import { TRACK_LENGTH_ORIGINS } from '../ducks/tracks';

const heatmapSubjectIDs = ({ view: { heatmapSubjectIDs } }) => heatmapSubjectIDs;
export const subjectTrackState = ({ view: { subjectTrackState } }) => subjectTrackState;
export const tracks = ({ data: { tracks } }) => tracks;
const trackLength = ({ view: { trackLength } }) => trackLength;
export const getPatrols = ({ data: { patrols: { results }} }) => results;
const getPatrolTrackIds = ({ view: { patrolTrackState }, data: { patrolStore } }) => uniq(
  [...patrolTrackState.visible, ...patrolTrackState.pinned]
    .map(patrolId => patrolStore[patrolId])
    .filter(p => !!p)
    .map(p => !!p.patrol_segments.length && p.patrol_segments[0].leader)
    .filter(l => !!l)
    .map(({ id }) => id),
);

export const getVisibleTrackIds = createSelector(
  [subjectTrackState],
  (subjectTrackState) => uniq([...subjectTrackState.pinned, ...subjectTrackState.visible]),
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

export const trackTimeEnvelope = createSelector([trackLength, getTimeSliderState, getEventFilterDateRange], 
  (trackLength, timeSliderState, eventFilterDateRange) => {
    const { virtualDate, active:timeSliderActive } = timeSliderState;
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
