import patrolTypes, { dogPatrol } from '../../../../../__test-helpers/fixtures/patrol-types';

import buildLegDraft from './';

describe('SideBar - PatrolsManager - LegForm - utils - buildLegDraft', () => {
  test('builds an empty draft when there is no leg', () => {
    expect(buildLegDraft()).toEqual({
      assets: [],
      endDate: '--',
      endLocation: null,
      endTime: '',
      isAutoEnd: false,
      isAutoStart: false,
      patrolType: null,
      startDate: '--',
      startLocation: null,
      startTime: '',
      team: null,
      teamLead: null,
      teamMembers: [],
      typeDetails: {},
      universalDetails: {},
    });
  });

  test('takes the times a leg actually ran and marks them as automatic', () => {
    const draft = buildLegDraft({
      time_range: {
        end_time: new Date(2026, 3, 13, 17, 45).toISOString(),
        start_time: new Date(2026, 3, 13, 8, 30).toISOString(),
      },
    });

    expect(draft.endDate).toBe('2026-04-13');
    expect(draft.endTime).toBe('17:45');
    expect(draft.isAutoEnd).toBe(true);
    expect(draft.startDate).toBe('2026-04-13');
    expect(draft.startTime).toBe('08:30');
    expect(draft.isAutoStart).toBe(true);
  });

  test('falls back to the scheduled times of a leg and does not mark them as automatic', () => {
    const draft = buildLegDraft({
      scheduled_end: new Date(2026, 3, 14, 17, 45).toISOString(),
      scheduled_start: new Date(2026, 3, 14, 8, 30).toISOString(),
      time_range: { end_time: null, start_time: null },
    });

    expect(draft.endDate).toBe('2026-04-14');
    expect(draft.isAutoEnd).toBe(false);
    expect(draft.startDate).toBe('2026-04-14');
    expect(draft.isAutoStart).toBe(false);
  });

  test('takes the leader of a leg as its team lead', () => {
    const leader = { id: 'leader-1', name: 'Alex' };

    expect(buildLegDraft({ leader }).teamLead).toBe(leader);
  });

  test('takes the patrol type of a leg', () => {
    expect(buildLegDraft({ patrol_type: dogPatrol.value }, patrolTypes)).toHaveProperty('patrolType', dogPatrol);
  });

  test('leaves the patrol type empty when the site does not serve the one of a leg', () => {
    expect(buildLegDraft({ patrol_type: 'a_retired_patrol_type' }, patrolTypes)).toHaveProperty('patrolType', null);
  });

  test('takes the locations of a leg', () => {
    const draft = buildLegDraft({
      end_location: { latitude: 2, longitude: 3 },
      start_location: { latitude: 0, longitude: 1 },
    });

    expect(draft.endLocation).toEqual({ latitude: 2, longitude: 3 });
    expect(draft.startLocation).toEqual({ latitude: 0, longitude: 1 });
  });
});
