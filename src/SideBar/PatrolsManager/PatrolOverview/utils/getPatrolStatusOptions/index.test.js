import getPatrolStatusOptions from './';
import { PATROL_UI_STATES } from '../../../../../constants';

const { ACTIVE, CANCELLED, DONE, INVALID, PAUSED, READY_TO_START, SCHEDULED, START_OVERDUE } = PATROL_UI_STATES;

describe('SideBar - PatrolsManager - PatrolOverview - utils - getPatrolStatusOptions', () => {
  const NOW = new Date('2026-04-13T12:00:00.000Z');

  const HOUR = 60 * 60 * 1000;

  const atOffset = (milliseconds) => new Date(NOW.getTime() + milliseconds).toISOString();

  const startedPatrol = {
    state: 'open',
    patrol_segments: [{ time_range: { start_time: atOffset(-2 * HOUR), end_time: null } }],
  };

  const unstartedPatrol = (scheduledStartOffset) => ({
    state: 'open',
    patrol_segments: [{
      scheduled_start: atOffset(scheduledStartOffset),
      time_range: { start_time: null, end_time: null },
    }],
  });

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('leads with the state the patrol is already in', () => {
    expect(getPatrolStatusOptions(startedPatrol, ACTIVE)[0]).toBe(ACTIVE);
  });

  test('offers cancelling, pausing or ending an active patrol', () => {
    expect(getPatrolStatusOptions(startedPatrol, ACTIVE)).toEqual([ACTIVE, CANCELLED, PAUSED, DONE]);
  });

  test('offers resuming, cancelling or ending a paused patrol', () => {
    expect(getPatrolStatusOptions(startedPatrol, PAUSED)).toEqual([PAUSED, ACTIVE, CANCELLED, DONE]);
  });

  test.each([SCHEDULED, READY_TO_START, START_OVERDUE])(
    'offers starting or cancelling a patrol waiting to start',
    (patrolState) => {
      expect(getPatrolStatusOptions(unstartedPatrol(HOUR), patrolState)).toEqual([patrolState, ACTIVE, CANCELLED]);
    }
  );

  test('offers an ended patrol the state reopening it lands on', () => {
    const endedPatrol = {
      state: 'done',
      patrol_segments: [{ time_range: { start_time: atOffset(-2 * HOUR), end_time: atOffset(-HOUR) } }],
    };

    expect(getPatrolStatusOptions(endedPatrol, DONE)).toEqual([DONE, ACTIVE]);
  });

  test('offers a cancelled patrol that never started the state reopening it lands on', () => {
    const cancelledPatrol = { ...unstartedPatrol(-2 * HOUR), state: 'cancelled' };

    expect(getPatrolStatusOptions(cancelledPatrol, CANCELLED)).toEqual([CANCELLED, START_OVERDUE]);
  });

  test('offers a cancelled patrol scheduled ahead the state reopening it lands on', () => {
    const cancelledPatrol = { ...unstartedPatrol(3 * HOUR), state: 'cancelled' };

    expect(getPatrolStatusOptions(cancelledPatrol, CANCELLED)).toEqual([CANCELLED, SCHEDULED]);
  });

  test('offers nothing to a patrol that is over and has no leg to reopen', () => {
    expect(getPatrolStatusOptions({ state: 'done', patrol_segments: [] }, DONE)).toEqual([DONE]);
  });

  test('offers nothing to a patrol that is over whose last leg never recorded a start', () => {
    const endedPatrolWithoutStart = {
      state: 'done',
      patrol_segments: [{ time_range: { start_time: null, end_time: atOffset(-HOUR) } }],
    };

    expect(getPatrolStatusOptions(endedPatrolWithoutStart, DONE)).toEqual([DONE]);
  });

  test('offers nothing to a patrol without a valid state', () => {
    expect(getPatrolStatusOptions({ ...startedPatrol, patrol_segments: [] }, INVALID)).toEqual([INVALID]);
  });

  test('does not offer pausing a patrol with no leg under way to pause', () => {
    const patrolBetweenLegs = {
      state: 'open',
      patrol_segments: [
        { id: 'leg-1', time_range: { end_time: atOffset(-HOUR), start_time: atOffset(-2 * HOUR) } },
        { id: 'leg-2', time_range: { end_time: null, start_time: atOffset(HOUR) } },
      ],
    };

    expect(getPatrolStatusOptions(patrolBetweenLegs, ACTIVE)).toEqual([ACTIVE, CANCELLED, DONE]);
  });

  test('offers a patrol cancelled while paused the paused state reopening it lands on', () => {
    const cancelledWhilePaused = {
      state: 'cancelled',
      patrol_segments: [{ id: 'leg-1', is_pause: true, time_range: { end_time: null, start_time: atOffset(-HOUR) } }],
    };

    expect(getPatrolStatusOptions(cancelledWhilePaused, CANCELLED)).toEqual([CANCELLED, PAUSED]);
  });

  test('offers a paused mobile patrol nothing but ending it', () => {
    const pausedMobilePatrol = {
      provenance: 'mobile',
      state: 'open',
      patrol_segments: [{ id: 'leg-1', is_pause: true, time_range: { end_time: null, start_time: atOffset(-HOUR) } }],
    };

    expect(getPatrolStatusOptions(pausedMobilePatrol, PAUSED)).toEqual([PAUSED, DONE]);
  });

  test('offers an active mobile patrol nothing but ending it', () => {
    expect(getPatrolStatusOptions({ ...startedPatrol, provenance: 'mobile' }, ACTIVE)).toEqual([ACTIVE, DONE]);
  });

  test('offers a mobile patrol that has not started the same statuses as any other', () => {
    expect(getPatrolStatusOptions({ ...unstartedPatrol(HOUR), provenance: 'mobile' }, SCHEDULED))
      .toEqual([SCHEDULED, ACTIVE, CANCELLED]);
  });

  test('offers a mobile patrol that is over the state reopening it lands on', () => {
    expect(getPatrolStatusOptions({ ...startedPatrol, provenance: 'mobile', state: 'done' }, DONE))
      .toEqual([DONE, ACTIVE]);
  });
});
