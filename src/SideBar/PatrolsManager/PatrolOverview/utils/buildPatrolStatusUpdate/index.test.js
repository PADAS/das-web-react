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
    'reopens a cancelled patrol that never started, leaving it $key and its plan as it was',
    (state) => {
      expect(buildPatrolStatusUpdate(unstartedPatrol, state)).toEqual({ state: 'open' });
    }
  );

  test('sends the leg it changes alone, leaving the ones it does not name untouched', () => {
    const update = buildPatrolStatusUpdate(startedPatrol, PATROL_UI_STATES.DONE);

    expect(update.patrol_segments).toHaveLength(1);
    expect(update.patrol_segments[0].id).toBe(lastLeg.id);
  });

  test('does not mutate the patrol it builds the update from', () => {
    buildPatrolStatusUpdate(startedPatrol, PATROL_UI_STATES.DONE);

    expect(startedPatrol.patrol_segments.at(-1).time_range.end_time).toBeNull();
  });

  test('pauses the patrol by closing the leg under way and opening a pause in its place', () => {
    const update = buildPatrolStatusUpdate(startedPatrol, PATROL_UI_STATES.PAUSED);

    expect(update.patrol_segments).toHaveLength(2);
    expect(update.patrol_segments[0]).toEqual({ id: lastLeg.id, time_range: { ...lastLeg.time_range, end_time: NOW } });
    expect(update.patrol_segments.at(-1)).toMatchObject({
      is_pause: true,
      time_range: { end_time: null, start_time: NOW },
    });
  });

  test('reopens a patrol cancelled while paused, rather than pausing it a second time', () => {
    const pauseLeg = {
      id: 'leg-2',
      is_pause: true,
      time_range: { end_time: null, start_time: '2026-04-13T10:00:00.000Z' },
    };
    const cancelledWhilePaused = { state: 'cancelled', patrol_segments: [firstLeg, pauseLeg] };

    expect(buildPatrolStatusUpdate(cancelledWhilePaused, PATROL_UI_STATES.PAUSED)).toEqual({ state: 'open' });
  });

  test('reopens a patrol ended while paused by clearing the end its pause was closed with', () => {
    const pauseLeg = {
      id: 'leg-2',
      is_pause: true,
      time_range: { end_time: NOW, start_time: '2026-04-13T10:00:00.000Z' },
    };
    const endedWhilePaused = { state: 'done', patrol_segments: [firstLeg, pauseLeg] };

    const update = buildPatrolStatusUpdate(endedWhilePaused, PATROL_UI_STATES.PAUSED);

    expect(update.state).toBe('open');
    expect(update.patrol_segments).toEqual([
      { id: 'leg-2', time_range: { end_time: null, start_time: '2026-04-13T10:00:00.000Z' } },
    ]);
  });

  test('resumes a paused patrol by closing the pause and opening a leg in its place', () => {
    const pausedPatrol = {
      state: 'open',
      patrol_segments: [firstLeg, { ...lastLeg, is_pause: true, patrol_type: 'routine_patrol' }],
    };

    const update = buildPatrolStatusUpdate(pausedPatrol, PATROL_UI_STATES.ACTIVE);

    expect(update.patrol_segments).toHaveLength(2);
    expect(update.patrol_segments[0].time_range.end_time).toBe(NOW);
    expect(update.patrol_segments.at(-1)).toMatchObject({
      is_pause: false,
      patrol_type: 'routine_patrol',
      time_range: { end_time: null, start_time: NOW },
    });
  });
});
