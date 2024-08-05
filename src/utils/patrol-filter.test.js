import { INITIAL_FILTER_STATE } from '../ducks/patrol-filter';
import { isFilterModified, calcPatrolFilterForRequest } from './patrol-filter';

describe('Patrol filter utils', () => {
  describe('calcPatrolFilterForRequest', () => {
    test('adds a constant exclude_empty_patrols=true param to all patrols API requests', () => {
      const value = calcPatrolFilterForRequest({ hello: false });

      expect(value).toContain('exclude_empty_patrols=true');
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
