import patrolTypes, { dogPatrol } from '../../../../../../__test-helpers/fixtures/patrol-types';

import buildNewLegDraft from './';

describe('SideBar - PatrolsManager - LegManager - NewLeg - utils - buildNewLegDraft', () => {
  const previousLeg = {
    end_location: { latitude: 2, longitude: 3 },
    leader: { id: 'leader-1', name: 'Alex' },
    patrol_type: dogPatrol.value,
    scheduled_end: new Date(2026, 3, 13, 17, 45).toISOString(),
    start_location: { latitude: 0, longitude: 1 },
    time_range: { end_time: null, start_time: new Date(2026, 3, 13, 6, 15).toISOString() },
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 3, 13, 8, 30));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const buildDraft = (overrides) => buildNewLegDraft({
    isAutoEnd: false,
    isAutoStart: false,
    patrolTypes,
    previousLeg,
    ...overrides,
  });

  test('starts the leg where the previous one ends', () => {
    const draft = buildDraft();

    expect(draft.startDate).toBe('2026-04-13');
    expect(draft.startTime).toBe('17:45');
  });

  test('starts the leg now when the previous one carries no end', () => {
    const draft = buildDraft({ previousLeg: { ...previousLeg, scheduled_end: null } });

    expect(draft.startDate).toBe('2026-04-13');
    expect(draft.startTime).toBe('08:30');
  });

  test('starts the leg where the previous one does when that one is planned ahead of time', () => {
    const draft = buildDraft({
      previousLeg: {
        ...previousLeg,
        scheduled_end: null,
        scheduled_start: new Date(2026, 3, 20, 6, 15).toISOString(),
        time_range: { end_time: null, start_time: null },
      },
    });

    expect(draft.startDate).toBe('2026-04-20');
    expect(draft.startTime).toBe('06:15');
  });

  test('starts the leg on the minute after an end carrying seconds', () => {
    const draft = buildDraft({
      previousLeg: { ...previousLeg, scheduled_end: new Date(2026, 3, 13, 17, 45, 32).toISOString() },
    });

    expect(draft.startDate).toBe('2026-04-13');
    expect(draft.startTime).toBe('17:46');
  });

  test('leaves the end of the leg empty', () => {
    const draft = buildDraft();

    expect(draft.endDate).toBe('--');
    expect(draft.endTime).toBe('');
  });

  test('leaves the locations of the leg empty', () => {
    const draft = buildDraft();

    expect(draft.endLocation).toBeNull();
    expect(draft.startLocation).toBeNull();
  });

  test('takes the patrol type and the team lead of the previous leg', () => {
    const draft = buildDraft();

    expect(draft.patrolType).toBe(dogPatrol);
    expect(draft.teamLead).toBe(previousLeg.leader);
  });

  test('takes the automatic start and end preferences', () => {
    const draft = buildDraft({ isAutoEnd: true, isAutoStart: true });

    expect(draft.isAutoEnd).toBe(true);
    expect(draft.isAutoStart).toBe(true);
  });

  test('builds an empty draft that starts now when there is no previous leg', () => {
    const draft = buildDraft({ previousLeg: null });

    expect(draft.patrolType).toBeNull();
    expect(draft.teamLead).toBeNull();
    expect(draft.startDate).toBe('2026-04-13');
    expect(draft.startTime).toBe('08:30');
  });
});
