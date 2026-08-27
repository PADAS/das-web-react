import i18next from 'i18next';

import '../i18nForTests';

import { formatDistanceInKilometers } from './distance';

describe('Utils - Distance', () => {
  describe('formatDistanceInKilometers', () => {
    const formatDistance = (kilometers) => formatDistanceInKilometers(i18next.getFixedT(null, 'utils'), kilometers);

    afterEach(async () => {
      await i18next.changeLanguage('en-US');
    });

    test('appends the kilometers unit to a whole number without adding decimals', () => {
      expect(formatDistance(12)).toBe('12km');
    });

    test('formats zero', () => {
      expect(formatDistance(0)).toBe('0km');
    });

    test('keeps a single fraction digit', () => {
      expect(formatDistance(12.3456)).toBe('12.3km');
    });

    test('rounds up to the single fraction digit', () => {
      expect(formatDistance(12.36)).toBe('12.4km');
    });

    test('rounds a distance below the fraction digit precision down to zero', () => {
      expect(formatDistance(0.04)).toBe('0km');
    });

    test('groups thousands', () => {
      expect(formatDistance(1234.5)).toBe('1,234.5km');
    });

    test('formats the number following the conventions of the active language', async () => {
      await i18next.changeLanguage('de-DE');

      expect(formatDistance(1234.5)).toBe('1.234,5km');
    });
  });
});
