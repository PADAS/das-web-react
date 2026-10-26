import { dogPatrol } from '../../../../../__test-helpers/fixtures/patrol-types';

import buildNewPatrolLegDraft from './';

describe('SideBar - PatrolsManager - NewPatrol - utils - buildNewPatrolLegDraft', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 3, 13, 8, 30));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const buildDraft = (overrides) => buildNewPatrolLegDraft({
    isAutoEnd: false,
    isAutoStart: false,
    patrolData: undefined,
    patrolType: dogPatrol,
    ...overrides,
  });

  test('starts the patrol now', () => {
    const draft = buildDraft();

    expect(draft.startDate).toBe('2026-04-13');
    expect(draft.startTime).toBe('08:30');
  });

  test('leaves the end of the patrol empty', () => {
    const draft = buildDraft();

    expect(draft.endDate).toBe('--');
    expect(draft.endTime).toBe('');
    expect(draft.endLocation).toBeNull();
  });

  test('takes the patrol type', () => {
    expect(buildDraft().patrolType).toBe(dogPatrol);
  });

  test('takes the automatic start and end preferences', () => {
    const draft = buildDraft({ isAutoEnd: true, isAutoStart: true });

    expect(draft.isAutoEnd).toBe(true);
    expect(draft.isAutoStart).toBe(true);
  });

  test('starts the patrol at the moment and place the patrol data points at', () => {
    const draft = buildDraft({
      patrolData: {
        location: { latitude: 10, longitude: 20 },
        time: new Date(2026, 3, 14, 16, 45).toISOString(),
      },
    });

    expect(draft.startDate).toBe('2026-04-14');
    expect(draft.startLocation).toEqual({ latitude: 10, longitude: 20 });
    expect(draft.startTime).toBe('16:45');
  });
});
