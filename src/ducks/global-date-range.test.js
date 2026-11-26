import { createTransform } from 'redux-persist';

import { generateDaysAgoDate } from '../utils/datetime';

import { withDefaultDateRangePersistence } from './global-date-range';

const DEFAULT_DAYS = 30;

describe('Ducks - Global date range', () => {
  describe('withDefaultDateRangePersistence', () => {
    let initialFilterState, otherTransform, storageConfig;
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-11-23T15:00:00.000Z'));

      initialFilterState = {
        filter: { date_range: { lower: generateDaysAgoDate(DEFAULT_DAYS).toISOString(), upper: null }, text: '' },
      };
      otherTransform = createTransform((state) => state, (state) => state);
      storageConfig = { key: 'filter', transforms: [otherTransform] };
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const getDateRangeTransform = () => withDefaultDateRangePersistence(storageConfig, initialFilterState).transforms[1];

    test('keeps the storage config and its own transforms', () => {
      const persistenceConfig = withDefaultDateRangePersistence(storageConfig, initialFilterState);

      expect(persistenceConfig.key).toBe('filter');
      expect(persistenceConfig.transforms[0]).toBe(otherTransform);
    });

    test('stores a filter at the default date range without its date range', () => {
      const filter = { ...initialFilterState.filter, text: 'snare' };

      expect(getDateRangeTransform().in(filter, 'filter')).toEqual({ text: 'snare' });
    });

    test('stores a filter at a custom date range as it is', () => {
      const filter = { date_range: { lower: '2026-01-01T00:00:00.000Z', upper: null }, text: '' };

      expect(getDateRangeTransform().in(filter, 'filter')).toEqual(filter);
    });

    test('restores a default date range stored on an earlier day as the default of the day the app loads', () => {
      const storedFilter = getDateRangeTransform().in(initialFilterState.filter, 'filter');

      jest.setSystemTime(new Date('2026-11-24T15:00:00.000Z'));
      initialFilterState.filter.date_range = { lower: generateDaysAgoDate(DEFAULT_DAYS).toISOString(), upper: null };

      expect(getDateRangeTransform().out(storedFilter, 'filter')).toEqual({
        date_range: { lower: '2026-10-25T00:00:00.000Z', upper: null },
        text: '',
      });
    });

    test('restores a custom date range as it is', () => {
      const filter = { date_range: { lower: '2026-01-01T00:00:00.000Z', upper: null }, text: '' };

      expect(getDateRangeTransform().out(filter, 'filter')).toEqual(filter);
    });

    test('leaves the other keys of the filter state alone', () => {
      expect(getDateRangeTransform().in(['active'], 'state')).toEqual(['active']);
    });
  });
});
