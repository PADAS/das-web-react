import { calcCursorPolygonAreaDisplayString, calcPolygonAreaDisplayString } from './utils';

describe('MapRulerControl - area utils', () => {
  describe('calcPolygonAreaDisplayString', () => {
    test('returns null with fewer than three points', () => {
      expect(calcPolygonAreaDisplayString([[0, 0], [1, 0]])).toBeNull();
    });

    test('closes the ring and returns the area in square kilometers', () => {
      expect(calcPolygonAreaDisplayString([[0, 0], [1, 0], [1, 1]])).toBe('6181.86km²');
    });
  });

  describe('calcCursorPolygonAreaDisplayString', () => {
    test('counts the cursor location as a vertex', () => {
      expect(calcCursorPolygonAreaDisplayString([[0, 0], [1, 0]], [1, 1])).toBe('6181.86km²');
    });

    test('ignores a cursor location identical to the last point', () => {
      expect(calcCursorPolygonAreaDisplayString([[0, 0], [1, 0]], [1, 0])).toBeNull();
    });

    test('returns null when the ring would have fewer than three distinct vertices', () => {
      expect(calcCursorPolygonAreaDisplayString([[0, 0]], [1, 0])).toBeNull();
    });

    test('returns null without a cursor location and fewer than three points', () => {
      expect(calcCursorPolygonAreaDisplayString([[0, 0], [1, 0]], null)).toBeNull();
    });
  });
});
