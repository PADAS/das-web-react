import buildLegDraft from '../buildLegDraft';
import { dogPatrol } from '../../../../../__test-helpers/fixtures/patrol-types';

import buildLegSegment from './';

describe('SideBar - PatrolsManager - LegForm - utils - buildLegSegment', () => {
  let leg;
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-13T12:00:00.000Z'));

    leg = { ...buildLegDraft(), patrolType: dogPatrol };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('takes the patrol type value and priority', () => {
    const segment = buildLegSegment(leg);

    expect(segment.patrol_type).toBe('dog_patrol');
    expect(segment.priority).toBe(0);
  });

  test('sends the team lead as the leg leader', () => {
    const teamLead = { id: 'leader-1', name: 'Alex' };

    expect(buildLegSegment({ ...leg, teamLead }).leader).toBe(teamLead);
    expect(buildLegSegment(leg).leader).toBeNull();
  });

  test('sets a past start as the time the leg ran', () => {
    const segment = buildLegSegment({ ...leg, startDate: '2026-04-13', startTime: '08:00' });

    expect(segment.scheduled_start).toBeNull();
    expect(segment.time_range.start_time).toBe(new Date('2026-04-13T08:00').toISOString());
  });

  test('schedules a future start the user did not ask to start automatically', () => {
    const segment = buildLegSegment({ ...leg, startDate: '2026-04-20', startTime: '08:00' });

    expect(segment.scheduled_start).toBe(new Date('2026-04-20T08:00').toISOString());
    expect(segment.time_range.start_time).toBeNull();
  });

  test('sets a future start the user asked to start automatically as the time the leg runs', () => {
    const segment = buildLegSegment({
      ...leg,
      isAutoStart: true,
      startDate: '2026-04-20',
      startTime: '08:00',
    });

    expect(segment.scheduled_start).toBeNull();
    expect(segment.time_range.start_time).toBe(new Date('2026-04-20T08:00').toISOString());
  });

  test('schedules a future end the user did not ask to end automatically', () => {
    const segment = buildLegSegment({ ...leg, endDate: '2026-04-20', endTime: '17:00' });

    expect(segment.scheduled_end).toBe(new Date('2026-04-20T17:00').toISOString());
    expect(segment.time_range.end_time).toBeNull();
  });

  test('leaves the times empty when there are no dates', () => {
    const segment = buildLegSegment(leg);

    expect(segment.scheduled_end).toBeNull();
    expect(segment.scheduled_start).toBeNull();
    expect(segment.time_range).toEqual({ end_time: null, start_time: null });
  });

  test('takes the locations of the draft', () => {
    const segment = buildLegSegment({
      ...leg,
      endLocation: { latitude: 2, longitude: 3 },
      startLocation: { latitude: 0, longitude: 1 },
    });

    expect(segment.end_location).toEqual({ latitude: 2, longitude: 3 });
    expect(segment.start_location).toEqual({ latitude: 0, longitude: 1 });
  });
});
