import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';
import { isFilterModified } from './patrol-filter';

describe('Patrol filter utils', () => {
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
