import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../ducks/patrol-filter';
import store from '../store';

import { isFilterModified, calcPatrolFilterForRequest } from './patrol-filter';

describe('Patrol filter utils', () => {
  describe('calcPatrolFilterForRequest', () => {
    afterEach(() => {
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
