import i18next from 'i18next';

import { format, getTimeInTimezone, STANDARD_DATE_FORMAT } from './datetime';

describe('format dates', () => {
  const date = new Date('1993-12-20T07:30:00');

  test('formats given date using standard date format', () => {
    expect(format(date, STANDARD_DATE_FORMAT)).toBe('20 Dec 93 07:30');
  });

  test('formats given date using custom format', () => {
    expect(format(date, 'MMMM dd, YYYY')).toBe('December 20, 1993');
  });

  test('formats and locale given date', () => {
    i18next.language = 'es';
    expect(format(date, 'MMMM dd, YYYY')).toBe('diciembre 20, 1993');
  });

  test('converts date time iso string to time string based on America/Monterrey time zone', () => {
    const date = new Date('2025-02-21T03:00:07.940Z');
    expect( getTimeInTimezone( date, 'America/Monterrey') ).toBe('21:00');
  });

  test('converts date time iso string to time string based on America/Los_Angeles time zone', () => {
    const date = new Date('2025-02-21T21:41:14.677Z');
    expect( getTimeInTimezone( date, 'America/Los_Angeles') ).toBe('13:41');
  });

  test('converts date time iso string to time string based on Asia/Hong_Kong time zone', () => {
    const date = new Date('2025-02-21T21:41:14.677Z');
    expect( getTimeInTimezone( date, 'Asia/Hong_Kong') ).toBe('05:41');
  });

  test('converts date time iso string to time string based on Asia/Istanbul time zone', () => {
    const date = new Date('2025-02-21T21:41:14.677Z');
    expect( getTimeInTimezone( date, 'Asia/Istanbul') ).toBe('00:41');
  });

  test('converts date time iso string to time string based on Australia/Sydney time zone', () => {
    const date = new Date('2025-02-21T21:41:14.677Z');
    expect( getTimeInTimezone( date, 'Australia/Sydney') ).toBe('08:41');
  });

  test('converts date time iso string to time string based on Africa/Nairobi time zone', () => {
    const date = new Date('2025-02-21T21:41:14.677Z');
    expect( getTimeInTimezone( date, 'Africa/Nairobi') ).toBe('00:41');
  });



});