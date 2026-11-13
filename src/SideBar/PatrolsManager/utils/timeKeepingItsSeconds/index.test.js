import timeKeepingItsSeconds from './';

describe('SideBar - PatrolsManager - utils - timeKeepingItsSeconds', () => {
  test('returns the stored time when the time falls on the same minute', () => {
    expect(timeKeepingItsSeconds('2026-10-19T17:04:00.000Z', '2026-10-19T17:04:21.329Z'))
      .toBe('2026-10-19T17:04:21.329Z');
  });

  test('returns the time when it falls on another minute than the stored time', () => {
    expect(timeKeepingItsSeconds('2026-10-19T17:05:00.000Z', '2026-10-19T17:04:21.329Z'))
      .toBe('2026-10-19T17:05:00.000Z');
  });

  test('returns the time when there is no stored time', () => {
    expect(timeKeepingItsSeconds('2026-10-19T17:04:00.000Z', null)).toBe('2026-10-19T17:04:00.000Z');
  });

  test('returns nothing when there is no time', () => {
    expect(timeKeepingItsSeconds(null, '2026-10-19T17:04:21.329Z')).toBeNull();
  });

  test('accepts a date as the time', () => {
    expect(timeKeepingItsSeconds(new Date('2026-10-19T17:04:00.000Z'), '2026-10-19T17:04:21.329Z'))
      .toBe('2026-10-19T17:04:21.329Z');
  });
});
