import { truncateFloatingNumber } from './math';

describe('Utils - math', () => {
  describe('truncateFloatingNumber', () => {
    test('truncates different values to the specified number of decimals', () => {
      expect(truncateFloatingNumber(143.763, 0)).toBe(143);
      expect(truncateFloatingNumber(143.763, 1)).toBe(143.7);
      expect(truncateFloatingNumber(143.763, 2)).toBe(143.76);
      expect(truncateFloatingNumber(143.763, 3)).toBe(143.763);
    });

    test('truncates a value with no enough decimals', () => {
      expect(truncateFloatingNumber(2.2, 3)).toBe(2.2);
    });

    test('truncates a value with no decimals', () => {
      expect(truncateFloatingNumber(32, 6)).toBe(32);
    });
  });
});
