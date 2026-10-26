import buildLegSegment from '../../../../LegForm/utils/buildLegSegment';
import { displayStartTimeForPatrolSegment } from '../../../../../../utils/patrols';

// A leg ends exactly where the next begins. An end already there needs no
// update, and the API leaves the legs an update does not name alone.
const buildPreviousPatrolSegmentEnd = (previousPatrolSegment, newPatrolSegment) => {
  const newPatrolSegmentStart = displayStartTimeForPatrolSegment(newPatrolSegment);

  if (!newPatrolSegmentStart || !displayStartTimeForPatrolSegment(previousPatrolSegment)) {
    return null;
  }

  // The end matches the kind of start: a real one for a leg that ran, a
  // scheduled one otherwise, so a leg nobody started never reads as finished.
  if (previousPatrolSegment.time_range?.start_time) {
    return previousPatrolSegment.time_range.end_time
      ? null
      : {
        id: previousPatrolSegment.id,
        time_range: { ...previousPatrolSegment.time_range, end_time: newPatrolSegmentStart.toISOString() },
      };
  }

  return previousPatrolSegment.scheduled_end
    ? null
    : { id: previousPatrolSegment.id, scheduled_end: newPatrolSegmentStart.toISOString() };
};

const buildAddLegUpdate = (patrol, leg) => {
  const newPatrolSegment = buildLegSegment(leg, { isFirstLeg: patrol.patrol_segments.length === 0 });
  const previousPatrolSegment = patrol.patrol_segments.at(-1);

  const previousPatrolSegmentEnd = previousPatrolSegment
    ? buildPreviousPatrolSegmentEnd(previousPatrolSegment, newPatrolSegment)
    : null;

  return {
    id: patrol.id,
    patrol_segments: previousPatrolSegmentEnd
      ? [previousPatrolSegmentEnd, newPatrolSegment]
      : [newPatrolSegment],
  };
};

export default buildAddLegUpdate;
