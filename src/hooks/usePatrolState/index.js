import { useEffect, useState } from 'react';
import { addMinutes, subHours } from 'date-fns';

import {
  calcPatrolState,
  DELTA_FOR_OVERDUE,
  displayStartTimeForPatrol,
  isPatrolCancelled,
  isPatrolDone,
  READY_TO_START_WINDOW_HOURS,
} from '../../utils/patrols';

export const MAX_TIMEOUT_DELAY = 6 * 60 * 60 * 1000; // 6 hours

const getNextPatrolStateTransitionTime = (patrol) => {
  if (isPatrolCancelled(patrol) || isPatrolDone(patrol)) {
    return null;
  }

  const firstSegment = patrol.patrol_segments?.[0];
  if (!firstSegment) {
    return null;
  }

  const displayStartTime = displayStartTimeForPatrol(patrol);
  const firstSegmentStartTime = firstSegment.time_range?.start_time;
  const lastSegmentEndTime = patrol.patrol_segments.at(-1).time_range?.end_time;

  const readyToStartTransitionTime = displayStartTime
    ? subHours(displayStartTime, READY_TO_START_WINDOW_HOURS)
    : null;
  // Any leg beginning turns the patrol active, so every one of them is worth
  // waiting for.
  const activeTransitionTimes = patrol.patrol_segments
    .filter((patrolSegment) => patrolSegment.time_range?.start_time)
    .map((patrolSegment) => new Date(patrolSegment.time_range.start_time));
  const startOverdueTransitionTime = !firstSegmentStartTime && firstSegment.scheduled_start
    ? addMinutes(new Date(firstSegment.scheduled_start), DELTA_FOR_OVERDUE)
    : null;
  const doneTransitionTime = lastSegmentEndTime ? new Date(lastSegmentEndTime) : null;

  const now = Date.now();
  return [readyToStartTransitionTime, ...activeTransitionTimes, startOverdueTransitionTime, doneTransitionTime]
    .filter((transitionTime) => transitionTime && transitionTime.getTime() > now)
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
};

const usePatrolState = (patrol) => {
  const [recheckCount, setRecheckCount] = useState(0);

  const patrolState = calcPatrolState(patrol);

  useEffect(() => {
    // recheckCount re-arms the timeout at the next transition time.
    const nextTransitionTime = getNextPatrolStateTransitionTime(patrol);
    const delay = nextTransitionTime
      // The extra millisecond keeps the timeout from firing before the
      // transition time is past.
      ? nextTransitionTime.getTime() - Date.now() + 1
      : MAX_TIMEOUT_DELAY;

    const timeoutId = window.setTimeout(
      () => setRecheckCount((count) => count + 1),
      Math.min(Math.max(delay, 0), MAX_TIMEOUT_DELAY)
    );

    return () => window.clearTimeout(timeoutId);
  }, [patrol, recheckCount]);

  return patrolState;
};

export default usePatrolState;
