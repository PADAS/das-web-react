import { act, renderHook } from '../../test-utils';

import { DELTA_FOR_OVERDUE } from '../../utils/patrols';
import { MAX_TIMEOUT_DELAY } from './';
import { PATROL_UI_STATES } from '../../constants';

import usePatrolState from './';

describe('usePatrolState', () => {
  const NOW = new Date('2026-04-13T12:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const atOffset = (minutes) => new Date(NOW.getTime() + minutes * 60_000);

  const makePatrol = (segment) => ({ state: 'open', patrol_segments: [segment] });

  const runningPatrolEndingIn = (minutes) => makePatrol({
    time_range: { start_time: atOffset(-60).toISOString(), end_time: atOffset(minutes).toISOString() },
  });

  test('returns the patrol state right away', () => {
    const { result } = renderHook(() => usePatrolState(runningPatrolEndingIn(45)));

    expect(result.current).toBe(PATROL_UI_STATES.ACTIVE);
  });

  test('re-derives the state when the patrol reaches its next transition', () => {
    const patrol = runningPatrolEndingIn(45);
    const { result } = renderHook(() => usePatrolState(patrol));

    expect(result.current).toBe(PATROL_UI_STATES.ACTIVE);

    act(() => {
      jest.advanceTimersByTime(45 * 60_000 + 1);
    });

    expect(result.current).toBe(PATROL_UI_STATES.DONE);
  });

  test('does not re-derive before the transition is due', () => {
    const patrol = runningPatrolEndingIn(45);
    const { result } = renderHook(() => usePatrolState(patrol));

    act(() => {
      jest.advanceTimersByTime(44 * 60_000);
    });

    expect(result.current).toBe(PATROL_UI_STATES.ACTIVE);
  });

  test('walks a scheduled patrol through each of its transitions', () => {
    // Starts in 3 hours: scheduled, then ready to start an hour out, then active.
    const patrol = makePatrol({ time_range: { start_time: atOffset(180).toISOString(), end_time: null } });
    const { result } = renderHook(() => usePatrolState(patrol));

    expect(result.current).toBe(PATROL_UI_STATES.SCHEDULED);

    act(() => {
      jest.advanceTimersByTime(120 * 60_000 + 1);
    });
    expect(result.current).toBe(PATROL_UI_STATES.READY_TO_START);

    act(() => {
      jest.advanceTimersByTime(60 * 60_000 + 1);
    });
    expect(result.current).toBe(PATROL_UI_STATES.ACTIVE);
  });

  test('re-derives the state when the patrol itself changes', () => {
    const { result, rerender } = renderHook((patrol) => usePatrolState(patrol), {
      initialProps: runningPatrolEndingIn(45),
    });

    expect(result.current).toBe(PATROL_UI_STATES.ACTIVE);

    rerender({ state: 'cancelled', patrol_segments: [] });

    expect(result.current).toBe(PATROL_UI_STATES.CANCELLED);
  });

  test('clears its timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');

    const { unmount } = renderHook(() => usePatrolState(runningPatrolEndingIn(45)));
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  describe('scheduling the recheck', () => {
    const recheckDelayFor = (patrol) => {
      const setTimeoutSpy = jest.spyOn(window, 'setTimeout');

      renderHook(() => usePatrolState(patrol));

      return setTimeoutSpy.mock.calls[0][1];
    };

    const afterMinutes = (minutes) => minutes * 60_000 + 1;

    test('schedules a single timeout rather than polling', () => {
      const setTimeoutSpy = jest.spyOn(window, 'setTimeout');

      renderHook(() => usePatrolState(runningPatrolEndingIn(45)));

      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    });

    test('lands on the end time of a running patrol', () => {
      expect(recheckDelayFor(runningPatrolEndingIn(45))).toBe(afterMinutes(45));
    });

    test('lands on the start time of a patrol about to begin', () => {
      const patrol = makePatrol({ time_range: { start_time: atOffset(20).toISOString(), end_time: null } });

      expect(recheckDelayFor(patrol)).toBe(afterMinutes(20));
    });

    test('lands an hour before the start of a patrol scheduled further out', () => {
      const patrol = makePatrol({ time_range: { start_time: atOffset(180).toISOString(), end_time: null } });

      expect(recheckDelayFor(patrol)).toBe(afterMinutes(120));
    });

    test('lands on the overdue threshold for a patrol that has not started', () => {
      const patrol = makePatrol({
        scheduled_start: atOffset(-10).toISOString(),
        time_range: { start_time: null, end_time: null },
      });

      expect(recheckDelayFor(patrol)).toBe(afterMinutes(DELTA_FOR_OVERDUE - 10));
    });

    test('lands on the earliest upcoming transition when several apply', () => {
      const patrol = makePatrol({
        scheduled_start: atOffset(5).toISOString(),
        time_range: { start_time: null, end_time: atOffset(600).toISOString() },
      });

      // The overdue threshold lands before the end time.
      expect(recheckDelayFor(patrol)).toBe(afterMinutes(5 + DELTA_FOR_OVERDUE));
    });

    test('reads the last leg of a multi leg patrol', () => {
      const patrol = {
        state: 'open',
        patrol_segments: [
          { time_range: { start_time: atOffset(-300).toISOString(), end_time: atOffset(-240).toISOString() } },
          { time_range: { start_time: atOffset(-240).toISOString(), end_time: atOffset(90).toISOString() } },
        ],
      };

      expect(recheckDelayFor(patrol)).toBe(afterMinutes(90));
    });

    test('caps the delay so a far off transition does not overflow the timer', () => {
      // A patrol scheduled a year out would overflow setTimeout's 32 bit delay.
      const patrol = makePatrol({ time_range: { start_time: atOffset(525_600).toISOString(), end_time: null } });

      expect(recheckDelayFor(patrol)).toBe(MAX_TIMEOUT_DELAY);
    });

    describe('checks back periodically instead of holding a timeout forever', () => {
      test('when a running patrol has no end time', () => {
        const patrol = makePatrol({ time_range: { start_time: atOffset(-60).toISOString(), end_time: null } });

        expect(recheckDelayFor(patrol)).toBe(MAX_TIMEOUT_DELAY);
      });

      test('when every transition already happened', () => {
        const patrol = makePatrol({
          time_range: { start_time: atOffset(-120).toISOString(), end_time: atOffset(-60).toISOString() },
        });

        expect(recheckDelayFor(patrol)).toBe(MAX_TIMEOUT_DELAY);
      });

      test.each([
        ['cancelled'],
        ['done'],
      ])('when only the server can move a %s patrol', (state) => {
        const patrol = {
          state,
          patrol_segments: [{
            time_range: { start_time: atOffset(-60).toISOString(), end_time: atOffset(45).toISOString() },
          }],
        };

        expect(recheckDelayFor(patrol)).toBe(MAX_TIMEOUT_DELAY);
      });

      test('when the patrol has no legs', () => {
        expect(recheckDelayFor({ state: 'open', patrol_segments: [] })).toBe(MAX_TIMEOUT_DELAY);
      });
    });
  });
});
