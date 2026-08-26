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

  const lastSegment = patrol.patrol_segments?.[patrol.patrol_segments.length - 1];
  if (!lastSegment) {
    return null;
  }

  const { scheduled_start, time_range: { start_time, end_time } = {} } = lastSegment;
  const displayStartTime = displayStartTimeForPatrol(patrol);

  const readyToStartTransitionTime = displayStartTime
    ? subHours(displayStartTime, READY_TO_START_WINDOW_HOURS)
    : null;
  const activeTransitionTime = start_time ? new Date(start_time) : null;
  const startOverdueTransitionTime = !start_time && scheduled_start
    ? addMinutes(new Date(scheduled_start), DELTA_FOR_OVERDUE)
    : null;
  const doneTransitionTime = end_time ? new Date(end_time) : null;

  const now = Date.now();
  return [readyToStartTransitionTime, activeTransitionTime, startOverdueTransitionTime, doneTransitionTime]
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
