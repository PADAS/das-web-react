import buildLegSegment from '../../../../LegForm/utils/buildLegSegment';
import { displayStartTimeForPatrolSegment } from '../../../../../../utils/patrols';

// A leg runs up to but not including its end, so the leg before this one ends
// exactly where the new one begins, run or still only planned.
const withEndAtNewLegStart = (previousLeg, newLegSegment) => {
  const newLegStart = displayStartTimeForPatrolSegment(newLegSegment);

  // A leg that never began has no end to speak of.
  if (!newLegStart || !displayStartTimeForPatrolSegment(previousLeg)) {
    return previousLeg;
  }

  // A leg that really began gets a real end, one only scheduled to begin gets
  // a scheduled one, so a leg nobody started never reads as finished. Only an
  // end of its own kind is the bound the new leg was validated against: a
  // scheduled end never stops the leg running past it.
  if (previousLeg.time_range?.start_time) {
    return previousLeg.time_range.end_time
      ? previousLeg
      : { ...previousLeg, time_range: { ...previousLeg.time_range, end_time: newLegStart.toISOString() } };
  }

  return previousLeg.scheduled_end
    ? previousLeg
    : { ...previousLeg, scheduled_end: newLegStart.toISOString() };
};

const buildAddLegUpdate = (patrol, leg) => {
  const newLegSegment = buildLegSegment(leg);
  const previousLeg = patrol.patrol_segments.at(-1);

  return {
    id: patrol.id,
    patrol_segments: previousLeg
      ? [...patrol.patrol_segments.slice(0, -1), withEndAtNewLegStart(previousLeg, newLegSegment), newLegSegment]
      : [newLegSegment],
  };
};

export default buildAddLegUpdate;
