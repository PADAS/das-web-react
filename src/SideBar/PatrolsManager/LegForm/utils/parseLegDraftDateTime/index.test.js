import parseLegDraftDateTime from './';

describe('SideBar - PatrolsManager - LegForm - utils - parseLegDraftDateTime', () => {
  test('combines the date and the time of the draft', () => {
    expect(parseLegDraftDateTime('2026-04-13', '08:30')).toEqual(new Date(2026, 3, 13, 8, 30));
  });

  test('falls back to midnight when the time is incomplete', () => {
    expect(parseLegDraftDateTime('2026-04-13', ':')).toEqual(new Date(2026, 3, 13, 0, 0));
  });

  test('returns null when the date is empty', () => {
    expect(parseLegDraftDateTime('--', '08:30')).toBeNull();
  });
});
