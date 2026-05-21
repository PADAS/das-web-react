// Compute live patrol/leg stats (duration, paused, active).
// Times are in milliseconds. Pass `windowStart`/`windowEnd` for a leg view.

export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0min';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}min` : `${hrs}h`;
};

// Sum the milliseconds spent paused inside [windowStart, windowEnd].
// Pause sessions whose `end` is null are considered still-open and use `now` as
// the end stamp when `patrolIsPaused` is true.
export const computePausedMs = ({ pauseSessions, windowStart, windowEnd, patrolIsPaused, now }) => {
  return pauseSessions.reduce((acc, s) => {
    if (!s.start) return acc;
    const sStart = +s.start;
    const sEnd = s.end ? +s.end : (patrolIsPaused ? +now : null);
    if (!sEnd) return acc;
    const clipStart = Math.max(sStart, +windowStart);
    const clipEnd = Math.min(sEnd, +windowEnd);
    if (clipEnd <= clipStart) return acc;
    return acc + (clipEnd - clipStart);
  }, 0);
};

// Compute duration / paused / active for an arbitrary [windowStart, windowEnd]
// time range, given the patrol's pause sessions and state.
export const computeStatsForWindow = ({
  windowStart,
  windowEnd,
  pauseSessions = [],
  patrolIsPaused = false,
  now = new Date(),
}) => {
  if (!windowStart) {
    return { durationMs: 0, pausedMs: 0, activeMs: 0 };
  }
  const start = +windowStart;
  const end = +(windowEnd || now);
  const durationMs = Math.max(0, end - start);
  const pausedMs = computePausedMs({ pauseSessions, windowStart: start, windowEnd: end, patrolIsPaused, now });
  const activeMs = Math.max(0, durationMs - pausedMs);
  return { durationMs, pausedMs, activeMs };
};
