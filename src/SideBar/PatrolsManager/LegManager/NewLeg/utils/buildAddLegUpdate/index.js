import buildLegSegment from '../../../../LegForm/utils/buildLegSegment';
import { displayStartTimeForPatrolSegment } from '../../../../../../utils/patrols';

// A leg ends exactly where the next begins. An end already there needs no
// update, and the API leaves the legs an update does not name alone.
const buildPreviousLegEnd = (previousLeg, newLegSegment) => {
  const newLegStart = displayStartTimeForPatrolSegment(newLegSegment);

  if (!newLegStart || !displayStartTimeForPatrolSegment(previousLeg)) {
    return null;
  }

  // The end matches the kind of start: a real one for a leg that ran, a
  // scheduled one otherwise, so a leg nobody started never reads as finished.
  if (previousLeg.time_range?.start_time) {
    return previousLeg.time_range.end_time
      ? null
      : { id: previousLeg.id, time_range: { ...previousLeg.time_range, end_time: newLegStart.toISOString() } };
  }

  return previousLeg.scheduled_end
    ? null
    : { id: previousLeg.id, scheduled_end: newLegStart.toISOString() };
};

const buildAddLegUpdate = (patrol, leg) => {
  const newLegSegment = buildLegSegment(leg, { isFirstLeg: patrol.patrol_segments.length === 0 });
  const previousLeg = patrol.patrol_segments.at(-1);

  const previousLegEnd = previousLeg ? buildPreviousLegEnd(previousLeg, newLegSegment) : null;

  return {
    id: patrol.id,
    patrol_segments: previousLegEnd ? [previousLegEnd, newLegSegment] : [newLegSegment],
  };
};

export default buildAddLegUpdate;
