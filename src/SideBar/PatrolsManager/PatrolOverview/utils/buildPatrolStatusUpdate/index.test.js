import buildPatrolStatusUpdate from './';
import { PATROL_UI_STATES } from '../../../../../constants';

describe('SideBar - PatrolsManager - PatrolOverview - utils - buildPatrolStatusUpdate', () => {
  const NOW = '2026-04-13T12:00:00.000Z';

  const firstLeg = {
    id: 'leg-1',
    time_range: { start_time: '2026-04-13T08:00:00.000Z', end_time: '2026-04-13T09:00:00.000Z' },
  };
  const lastLeg = { id: 'leg-2', time_range: { start_time: '2026-04-13T10:00:00.000Z', end_time: null } };

  const startedPatrol = { state: 'open', patrol_segments: [firstLeg, lastLeg] };

  const unstartedPatrol = {
    state: 'cancelled',
    patrol_segments: [{
      id: 'leg-1',
      scheduled_start: '2026-04-13T10:00:00.000Z',
      time_range: { start_time: null, end_time: null },
    }],
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('cancels the patrol without touching its legs', () => {
    expect(buildPatrolStatusUpdate(startedPatrol, PATROL_UI_STATES.CANCELLED)).toEqual({ state: 'cancelled' });
  });

  test('ends the patrol by stamping the last leg end time, leaving its start time alone', () => {
    const update = buildPatrolStatusUpdate(startedPatrol, PATROL_UI_STATES.DONE);

    expect(update.state).toBe('done');
    expect(update.patrol_segments.at(-1).time_range)
      .toEqual({ start_time: lastLeg.time_range.start_time, end_time: NOW });
  });

  test('starts a patrol that never started by stamping the last leg start time', () => {
    const update = buildPatrolStatusUpdate(unstartedPatrol, PATROL_UI_STATES.ACTIVE);

    expect(update.state).toBe('open');
    expect(update.patrol_segments.at(-1).time_range).toEqual({ start_time: NOW, end_time: null });
  });

  test('makes an ended patrol active again by clearing its end time, without restamping its start', () => {
    const endedPatrol = {
      state: 'done',
      patrol_segments: [firstLeg, { ...lastLeg, time_range: { ...lastLeg.time_range, end_time: NOW } }],
    };

    const update = buildPatrolStatusUpdate(endedPatrol, PATROL_UI_STATES.ACTIVE);

    expect(update.state).toBe('open');
    expect(update.patrol_segments.at(-1).time_range)
      .toEqual({ start_time: lastLeg.time_range.start_time, end_time: null });
  });

  test('starts a patrol whose start time is still ahead by restamping it, rather than only reopening it', () => {
    const patrolStartingLater = {
      state: 'open',
      patrol_segments: [{ id: 'leg-1', time_range: { start_time: '2026-04-13T15:00:00.000Z', end_time: null } }],
    };

    const update = buildPatrolStatusUpdate(patrolStartingLater, PATROL_UI_STATES.ACTIVE);

    expect(update.state).toBe('open');
    expect(update.patrol_segments.at(-1).time_range).toEqual({ start_time: NOW, end_time: null });
  });

  test.each([PATROL_UI_STATES.SCHEDULED, PATROL_UI_STATES.READY_TO_START, PATROL_UI_STATES.START_OVERDUE])(
    'reopens a cancelled patrol that never started, leaving it $key',
    (state) => {
      const update = buildPatrolStatusUpdate(unstartedPatrol, state);

      expect(update.state).toBe('open');
      expect(update.patrol_segments.at(-1).time_range).toEqual({ start_time: null, end_time: null });
    }
  );

  test('sends every leg, but only rebuilds the one it changes', () => {
    const update = buildPatrolStatusUpdate(startedPatrol, PATROL_UI_STATES.DONE);

    expect(update.patrol_segments).toHaveLength(startedPatrol.patrol_segments.length);
    expect(update.patrol_segments[0]).toBe(firstLeg);
  });

  test('does not mutate the patrol it builds the update from', () => {
    buildPatrolStatusUpdate(startedPatrol, PATROL_UI_STATES.DONE);

    expect(startedPatrol.patrol_segments.at(-1).time_range.end_time).toBeNull();
  });

  test('has nothing to send for a paused patrol until the API models one', () => {
    expect(buildPatrolStatusUpdate(startedPatrol, PATROL_UI_STATES.PAUSED)).toBeNull();
  });
});
