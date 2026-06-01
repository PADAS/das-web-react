import { getVtRangeParam } from './vector-tiles';

describe('utils - vector-tiles', () => {
  describe('getVtRangeParam', () => {
    test.each([
      [1,   '30'],
      [30,  '30'],
      [31,  '45'],
      [45,  '45'],
      [46,  '60'],
      [60,  '60'],
      [61,  '90'],
      [90,  '90'],
      [91,  '150'],
      [150, '150'],
      [151, '210'],
      [210, '210'],
      [211, '365'],
      [365, '365'],
      [366, '500'],
      [500, '500'],
      [501, 'all'],
      [999, 'all'],
    ])('%i days → returns %s', (days, expected) => {
      expect(getVtRangeParam(days)).toBe(expected);
    });
  });
});
