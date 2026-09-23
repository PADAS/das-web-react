import { useEffect, useState } from 'react';
import { addMinutes, subHours } from 'date-fns';

import {
  calcPatrolSegmentState,
  calcPatrolState,
  DELTA_FOR_OVERDUE,
  displayStartTimeForPatrolSegment,
  isPatrolCancelled,
  isPatrolDone,
  READY_TO_START_WINDOW_HOURS,
} from '../../utils/patrols';

export const MAX_TIMEOUT_DELAY = 6 * 60 * 60 * 1000; // 6 hours

// A leg's state is read off the whole patrol, so a leg reading and a patrol
// reading wait on the same moments.
const getNextPatrolStateTransitionTime = (patrol) => {
  if (isPatrolCancelled(patrol) || isPatrolDone(patrol)) {
    return null;
  }

  const patrolSegments = patrol.patrol_segments ?? [];

  const [firstSegment] = patrolSegments;
  if (!firstSegment) {
    return null;
  }

  const displayStartTime = displayStartTimeForPatrolSegment(firstSegment);

  const transitionTimes = [
    // A patrol takes its schedule from its first leg: it is ready to start an
    // hour before that leg's start and overdue half an hour after it.
    displayStartTime ? subHours(displayStartTime, READY_TO_START_WINDOW_HOURS) : null,
    !firstSegment.time_range?.start_time && firstSegment.scheduled_start
      ? addMinutes(new Date(firstSegment.scheduled_start), DELTA_FOR_OVERDUE)
      : null,
    // Every leg begins and ends by itself, and each of those moves the leg the
    // patrol is on.
    ...patrolSegments.flatMap((patrolSegment) => [
      patrolSegment.time_range?.start_time ? new Date(patrolSegment.time_range.start_time) : null,
      patrolSegment.time_range?.end_time ? new Date(patrolSegment.time_range.end_time) : null,
    ]),
  ];

  const now = Date.now();
  return transitionTimes
    .filter((transitionTime) => transitionTime && transitionTime.getTime() > now)
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
};

const usePatrolState = (patrol, patrolSegment = null) => {
  const [recheckCount, setRecheckCount] = useState(0);

  const patrolState = patrolSegment ? calcPatrolSegmentState(patrol, patrolSegment) : calcPatrolState(patrol);

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
