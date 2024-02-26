import i18next from 'i18next';

import { format, STANDARD_DATE_FORMAT } from './datetime';

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

});