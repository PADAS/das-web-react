import '../i18nForTests';
import i18next from 'i18next';

import {
  format,
  getTimeInTimezone,
  longTermDurationHumanizer,
  resolveDurationHumanizerLanguage,
  STANDARD_DATE_FORMAT,
} from './datetime';

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

  test('converts date time iso string to time string based on the runtime time zone when given no time zone', () => {
    const date = new Date('2025-02-21T21:41:14.677Z');
    expect(getTimeInTimezone(date, null))
      .toBe(getTimeInTimezone(date, Intl.DateTimeFormat().resolvedOptions().timeZone));
  });

});

describe('resolveDurationHumanizerLanguage', () => {
  test('returns the bare language code for a language humanize-duration supports', () => {
    expect(resolveDurationHumanizerLanguage('es')).toBe('es');
  });

  test('strips the region suffix from a supported language', () => {
    expect(resolveDurationHumanizerLanguage('en-US')).toBe('en');
  });

  test('falls back to english for a language humanize-duration has no translation for', () => {
    expect(resolveDurationHumanizerLanguage('ne-NP')).toBe('en');
  });

  test('falls back to english when no language is given', () => {
    expect(resolveDurationHumanizerLanguage(undefined)).toBe('en');
  });
});

describe('longTermDurationHumanizer', () => {
  const TWO_DAYS_AND_THREE_HOURS = ((2 * 24) + 3) * 60 * 60 * 1000;

  const humanizeDuration = (duration, language = 'en-US') =>
    longTermDurationHumanizer(i18next.getFixedT(null, 'dates'), language)(duration);

  test('writes the two largest units out in words', () => {
    expect(humanizeDuration(TWO_DAYS_AND_THREE_HOURS)).toBe('2 days 3 hours');
  });

  test('leaves the seconds out', () => {
    expect(humanizeDuration((21 * 60 * 1000) + (40 * 1000))).toBe('21 minutes');
  });

  test('says a duration under a minute is less than one rather than no time at all', () => {
    expect(humanizeDuration(33 * 1000)).toBe('less than a minute');
  });

  test('writes the units in the language of the user', () => {
    expect(humanizeDuration(TWO_DAYS_AND_THREE_HOURS, 'es')).toBe('2 días 3 horas');
  });

  test('writes the units in English for a language it does not support', () => {
    expect(humanizeDuration(TWO_DAYS_AND_THREE_HOURS, 'ne-NP')).toBe('2 days 3 hours');
  });
});
