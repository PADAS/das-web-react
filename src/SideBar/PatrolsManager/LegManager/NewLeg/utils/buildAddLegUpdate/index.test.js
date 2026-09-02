import buildLegDraft from '../../../../LegForm/utils/buildLegDraft';
import { dogPatrol } from '../../../../../../__test-helpers/fixtures/patrol-types';

import buildAddLegUpdate from './';

describe('SideBar - PatrolsManager - LegManager - NewLeg - utils - buildAddLegUpdate', () => {
  let leg, patrol;
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 3, 13, 12, 0));

    leg = {
      ...buildLegDraft(),
      patrolType: dogPatrol,
      startDate: '2026-04-13',
      startTime: '11:00',
    };

    patrol = {
      id: 'patrol-1',
      patrol_segments: [{
        id: 'leg-1',
        scheduled_end: null,
        scheduled_start: null,
        time_range: { end_time: null, start_time: new Date(2026, 3, 13, 6, 0).toISOString() },
      }],
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('adds the leg at the end of the patrol', () => {
    const patrolUpdate = buildAddLegUpdate(patrol, leg);

    expect(patrolUpdate.id).toBe('patrol-1');
    expect(patrolUpdate.patrol_segments).toHaveLength(2);
    expect(patrolUpdate.patrol_segments[0].id).toBe('leg-1');
    expect(patrolUpdate.patrol_segments[1].patrol_type).toBe(dogPatrol.value);
  });

  test('ends the previous leg where the new one begins', () => {
    const patrolUpdate = buildAddLegUpdate(patrol, leg);

    expect(patrolUpdate.patrol_segments[0].time_range.end_time)
      .toBe(new Date(2026, 3, 13, 11, 0).toISOString());
    expect(patrolUpdate.patrol_segments[0].time_range.start_time)
      .toBe(patrol.patrol_segments[0].time_range.start_time);
  });

  test('ends the previous leg where a leg planned ahead of time begins', () => {
    const patrolUpdate = buildAddLegUpdate(patrol, { ...leg, startDate: '2026-04-20', startTime: '08:00' });

    expect(patrolUpdate.patrol_segments[1].scheduled_start).toBe(new Date(2026, 3, 20, 8, 0).toISOString());
    expect(patrolUpdate.patrol_segments[0].time_range.end_time)
      .toBe(new Date(2026, 3, 20, 8, 0).toISOString());
  });

  test('leaves the previous leg alone when it already carries an end', () => {
    patrol.patrol_segments[0].time_range.end_time = new Date(2026, 3, 13, 10, 0).toISOString();

    expect(buildAddLegUpdate(patrol, leg).patrol_segments[0]).toBe(patrol.patrol_segments[0]);
  });

  test('leaves the previous leg alone when it is only scheduled to end', () => {
    patrol.patrol_segments[0].scheduled_end = new Date(2026, 3, 13, 10, 0).toISOString();

    expect(buildAddLegUpdate(patrol, leg).patrol_segments[0]).toBe(patrol.patrol_segments[0]);
  });

  test('leaves the previous leg alone when it never began', () => {
    patrol.patrol_segments[0].time_range.start_time = null;

    expect(buildAddLegUpdate(patrol, leg).patrol_segments[0]).toBe(patrol.patrol_segments[0]);
  });

  test('schedules the end of a previous leg that is itself only scheduled to begin', () => {
    patrol.patrol_segments[0].time_range.start_time = null;
    patrol.patrol_segments[0].scheduled_start = new Date(2026, 3, 20, 6, 0).toISOString();

    const patrolUpdate = buildAddLegUpdate(patrol, { ...leg, startDate: '2026-04-20', startTime: '10:00' });

    expect(patrolUpdate.patrol_segments[0].scheduled_end).toBe(new Date(2026, 3, 20, 10, 0).toISOString());
    expect(patrolUpdate.patrol_segments[0].time_range.end_time).toBeNull();
  });

  test('leaves every leg before the previous one alone', () => {
    const firstLeg = {
      id: 'leg-0',
      time_range: { end_time: new Date(2026, 3, 13, 6, 0).toISOString(), start_time: new Date(2026, 3, 13, 5, 0).toISOString() },
    };
    patrol.patrol_segments = [firstLeg, ...patrol.patrol_segments];

    const patrolUpdate = buildAddLegUpdate(patrol, leg);

    expect(patrolUpdate.patrol_segments).toHaveLength(3);
    expect(patrolUpdate.patrol_segments[0]).toBe(firstLeg);
  });

  test('adds the leg as the only one of a patrol without legs', () => {
    patrol.patrol_segments = [];

    const patrolUpdate = buildAddLegUpdate(patrol, leg);

    expect(patrolUpdate.patrol_segments).toHaveLength(1);
    expect(patrolUpdate.patrol_segments[0].patrol_type).toBe(dogPatrol.value);
  });
});
