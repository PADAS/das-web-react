import buildLegSegment from '../../../../LegForm/utils/buildLegSegment';
import { displayEndTimeForPatrolSegment, displayStartTimeForPatrolSegment } from '../../../../../../utils/patrols';

// A leg runs up to but not including its end, so the leg before this one ends
// exactly where the new one begins, run or still only planned.
const withEndAtNewLegStart = (previousLeg, newLegSegment) => {
  const newLegStart = displayStartTimeForPatrolSegment(newLegSegment);

  // A leg that never began has no end to speak of, and one that already carries
  // an end is the very bound the new leg was validated against.
  if (!newLegStart
    || !displayStartTimeForPatrolSegment(previousLeg)
    || displayEndTimeForPatrolSegment(previousLeg)) {
    return previousLeg;
  }

  // A leg that really began gets a real end, one only scheduled to begin gets
  // a scheduled one, so a leg nobody started never reads as finished.
  return previousLeg.time_range?.start_time
    ? { ...previousLeg, time_range: { ...previousLeg.time_range, end_time: newLegStart.toISOString() } }
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
