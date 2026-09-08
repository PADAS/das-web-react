import '../../../../../i18nForTests';

import buildLegDraft from '../buildLegDraft';

import getStaticFieldErrors from './';

describe('SideBar - PatrolsManager - LegForm - utils - getStaticFieldErrors', () => {
  let leg;
  beforeEach(() => {
    leg = {
      ...buildLegDraft(),
      patrolType: { display: 'Foot Patrol', id: 'patrol-type-1', value: 'foot' },
      startDate: '2026-04-13',
      startTime: '08:00',
    };
  });

  test('does not report errors when the times are valid', () => {
    expect(getStaticFieldErrors(leg)).toEqual({});
  });

  test('reports a missing start date', () => {
    expect(getStaticFieldErrors({ ...leg, startDate: '--' })).toEqual({
      startDate: 'A leg needs a start date.',
    });
  });

  test('reports a start date the calendar does not have', () => {
    expect(getStaticFieldErrors({ ...leg, startDate: '2026-02-31' })).toEqual({
      startDate: 'A leg needs a start date.',
    });
  });

  test('reports a missing start time', () => {
    expect(getStaticFieldErrors({ ...leg, startTime: ':' })).toEqual({
      startTime: 'A leg needs a start time.',
    });
  });

  test('reports a half typed start time', () => {
    expect(getStaticFieldErrors({ ...leg, startTime: '08:' })).toEqual({
      startTime: 'A leg needs a start time.',
    });
  });

  test('reports an end date earlier than the start date', () => {
    expect(getStaticFieldErrors({ ...leg, endDate: '2026-04-12', endTime: '08:00' })).toEqual({
      endDate: 'The end of the leg must be later than its start.',
    });
  });

  test('reports an end time earlier than the start time on the same day', () => {
    expect(getStaticFieldErrors({ ...leg, endDate: '2026-04-13', endTime: '07:00' })).toEqual({
      endDate: 'The end of the leg must be later than its start.',
    });
  });

  test('does not report an end time later than the start time on the same day', () => {
    expect(getStaticFieldErrors({ ...leg, endDate: '2026-04-13', endTime: '09:00' })).toEqual({});
  });

  test('reports a missing end time when the leg has an end date', () => {
    expect(getStaticFieldErrors({ ...leg, endDate: '2026-04-20', endTime: ':' })).toEqual({
      endTime: 'A leg with an end date needs an end time.',
    });
  });

  test('does not report a missing end time when the leg has no end date', () => {
    expect(getStaticFieldErrors({ ...leg, endTime: ':' })).toEqual({});
  });

  test('reports a missing patrol type', () => {
    expect(getStaticFieldErrors({ ...leg, patrolType: null })).toEqual({
      patrolType: 'A leg needs a patrol type.',
    });
  });

  test('reports the erroneous times of the leg before its missing patrol type', () => {
    expect(getStaticFieldErrors({ ...leg, patrolType: null, startDate: '--' })).toEqual({
      startDate: 'A leg needs a start date.',
    });
  });

  describe('when the leg follows another one', () => {
    test('reports a start date earlier than the earliest start of the leg', () => {
      expect(getStaticFieldErrors(leg, new Date(2026, 3, 14, 8, 0))).toEqual({
        startDate: 'This leg cannot overlap the previous one.',
      });
    });

    test('reports a start time earlier than the earliest start of the leg on the same day', () => {
      expect(getStaticFieldErrors(leg, new Date(2026, 3, 13, 9, 0))).toEqual({
        startDate: 'This leg cannot overlap the previous one.',
      });
    });

    test('reports a start that falls short of the earliest start of the leg by seconds', () => {
      expect(getStaticFieldErrors(leg, new Date(2026, 3, 13, 8, 0, 32))).toEqual({
        startDate: 'This leg cannot overlap the previous one.',
      });
    });

    test('does not report a start that meets the earliest start of the leg', () => {
      expect(getStaticFieldErrors(leg, new Date(2026, 3, 13, 8, 0))).toEqual({});
    });

    test('does not report a start later than the earliest start of the leg', () => {
      expect(getStaticFieldErrors(leg, new Date(2026, 3, 12, 8, 0))).toEqual({});
    });

    test('reports the missing start date before comparing it with the previous leg', () => {
      expect(getStaticFieldErrors({ ...leg, startDate: '--' }, new Date(2026, 3, 14, 8, 0))).toEqual({
        startDate: 'A leg needs a start date.',
      });
    });

    test('reports the missing start time before comparing it with the previous leg', () => {
      expect(getStaticFieldErrors({ ...leg, startTime: ':' }, new Date(2026, 3, 14, 8, 0))).toEqual({
        startTime: 'A leg needs a start time.',
      });
    });
  });
});
