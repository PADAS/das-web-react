import '../../../../../i18nForTests';

import buildLegDraft from '../buildLegDraft';

import getStaticFieldErrors from './';

describe('SideBar - PatrolsManager - LegForm - utils - getStaticFieldErrors', () => {
  let leg;
  beforeEach(() => {
    leg = { ...buildLegDraft(), startDate: '2026-04-13', startTime: '08:00' };
  });

  test('does not report errors when the times are valid', () => {
    expect(getStaticFieldErrors(leg)).toEqual({});
  });

  test('reports a missing start date', () => {
    expect(getStaticFieldErrors({ ...leg, startDate: '--' })).toEqual({
      startDate: 'A patrol needs a start date.',
    });
  });

  test('reports a start date the calendar does not have', () => {
    expect(getStaticFieldErrors({ ...leg, startDate: '2026-02-31' })).toEqual({
      startDate: 'A patrol needs a start date.',
    });
  });

  test('reports an end date earlier than the start date', () => {
    expect(getStaticFieldErrors({ ...leg, endDate: '2026-04-12', endTime: '08:00' })).toEqual({
      endDate: 'The end of the patrol must be later than its start.',
    });
  });

  test('reports an end time earlier than the start time on the same day', () => {
    expect(getStaticFieldErrors({ ...leg, endDate: '2026-04-13', endTime: '07:00' })).toEqual({
      endDate: 'The end of the patrol must be later than its start.',
    });
  });

  test('does not report an end time later than the start time on the same day', () => {
    expect(getStaticFieldErrors({ ...leg, endDate: '2026-04-13', endTime: '09:00' })).toEqual({});
  });
});
