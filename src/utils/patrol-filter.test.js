import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../ducks/patrol-filter';
import { resetGlobalDateRange, updateGlobalDateRange } from '../ducks/global-date-range';
import store from '../store';

import { calcPatrolFilterForRequest, isFilterModified } from './patrol-filter';

describe('Patrol filter utils', () => {
  describe('calcPatrolFilterForRequest', () => {
    afterEach(() => {
      jest.useRealTimers();

      store.dispatch(resetGlobalDateRange());
      store.dispatch(updatePatrolFilter({
        filter: { patrols_overlap_daterange: INITIAL_FILTER_STATE.filter.patrols_overlap_daterange },
      }));
    });

    test('adds a constant exclude_empty_patrols=true param to all patrols API requests', () => {
      const value = calcPatrolFilterForRequest({ hello: false });

      expect(value).toContain('exclude_empty_patrols=true');
    });

    test('sends the date filter mode the user picked while the date range is at its default', () => {
      store.dispatch(updatePatrolFilter({ filter: { patrols_overlap_daterange: false } }));

      const value = calcPatrolFilterForRequest({ format: 'object' });

      expect(value.filter.date_range).toEqual(INITIAL_FILTER_STATE.filter.date_range);
      expect(value.filter.patrols_overlap_daterange).toBe(false);
    });

    test('ends an open date range at the end of the day the request is made', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-09-28T12:00:00.000Z'));
      store.dispatch(updateGlobalDateRange({ lower: '2026-09-21T00:00:00.000Z', upper: null }));
      jest.setSystemTime(new Date('2026-09-29T12:00:00.000Z'));

      const value = calcPatrolFilterForRequest({ format: 'object' });

      expect(value.filter.date_range).toEqual({ lower: '2026-09-21T00:00:00.000Z', upper: '2026-09-29T23:59:59.999Z' });
    });

    test('ends an open date range that starts after today at the end of its first day', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-09-28T12:00:00.000Z'));
      store.dispatch(updateGlobalDateRange({ lower: '2026-10-02T08:00:00.000Z', upper: null }));

      const value = calcPatrolFilterForRequest({ format: 'object' });

      expect(value.filter.date_range.upper).toBe('2026-10-02T23:59:59.999Z');
    });

    test('keeps the end of a date range that has one', () => {
      const dateRange = { lower: '2026-01-01T00:00:00.000Z', upper: '2026-02-01T00:00:00.000Z' };
      store.dispatch(updateGlobalDateRange(dateRange));

      expect(calcPatrolFilterForRequest({ format: 'object' }).filter.date_range).toEqual(dateRange);
    });

    test('leaves the stored date range open', () => {
      store.dispatch(updateGlobalDateRange({ lower: '2026-01-01T00:00:00.000Z', upper: null }));

      calcPatrolFilterForRequest({ format: 'object' });

      expect(store.getState().data.patrolFilter.filter.date_range.upper).toBeNull();
    });
  });

  describe('isFilterModified', () => {
    test('returns false if the filter has the default values', () => {
      expect(isFilterModified(INITIAL_FILTER_STATE)).toBe(false);
    });

    test('returns true if the filter does not have the default values', () => {
      let filter = { ...INITIAL_FILTER_STATE, status: 'active' };

      expect(isFilterModified(filter)).toBe(true);

      filter = { ...INITIAL_FILTER_STATE, filter: { ...INITIAL_FILTER_STATE.filter, text: 'patrol' } };

      expect(isFilterModified(filter)).toBe(true);
    });
  });
});
