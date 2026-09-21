import buildLegDraft from '../../../utils/buildLegDraft';
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
    const segment = buildLegSegment({ ...leg, startDate: '2026-04-12', startTime: '08:00' });

    expect(segment.scheduled_start).toBeNull();
    expect(segment.time_range.start_time).toBe(new Date('2026-04-12T08:00').toISOString());
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

  test('sends the team, the members and the assets as the ids the API stores', () => {
    const segment = buildLegSegment({
      ...leg,
      assets: [{ id: 'asset-1', name: 'Land Cruiser' }],
      team: { display: 'Alpha', id: 'team-1' },
      teamLead: { id: 'leader-1', name: 'Alex' },
      teamMembers: [{ id: 'leader-1', name: 'Alex' }, { id: 'member-1', name: 'Nadia' }],
    });

    expect(segment.assets).toEqual(['asset-1']);
    expect(segment.members).toEqual(['leader-1', 'member-1']);
    expect(segment.team).toBe('team-1');
  });

  test('adds the team lead to the members the API stores', () => {
    const segment = buildLegSegment({
      ...leg,
      teamLead: { id: 'leader-1', name: 'Alex' },
      teamMembers: [{ id: 'member-1', name: 'Nadia' }],
    });

    expect(segment.members).toEqual(['leader-1', 'member-1']);
  });

  test('leaves the team, the members and the assets empty when the user picked none', () => {
    const segment = buildLegSegment(leg);

    expect(segment.assets).toEqual([]);
    expect(segment.members).toEqual([]);
    expect(segment.team).toBeNull();
  });

  test('sends the universal and the patrol type fields as the leg details', () => {
    const segment = buildLegSegment({
      ...leg,
      typeDetails: { breed: 'malinois' },
      universalDetails: { objective: 'Snare sweep' },
    });

    expect(segment.segment_details).toEqual({ objective: 'Snare sweep' });
    expect(segment.type_details).toEqual({ breed: 'malinois' });
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
