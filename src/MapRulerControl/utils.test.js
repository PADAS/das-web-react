import { calcCursorPolygonAreaDisplayString, calcPolygonAreaDisplayString } from './utils';

const SMALL_SQUARE = [[0, 0], [0.00063, 0], [0.00063, 0.00063], [0, 0.00063]];

describe('MapRulerControl - area utils', () => {
  describe('calcPolygonAreaDisplayString', () => {
    test('returns null with fewer than three points', () => {
      expect(calcPolygonAreaDisplayString([[0, 0], [1, 0]])).toBeNull();
    });

    test('returns null with fewer than three distinct points', () => {
      expect(calcPolygonAreaDisplayString([[0, 0], [1, 0], [1, 0]])).toBeNull();
    });

    test('closes the ring and returns the area in square kilometers', () => {
      expect(calcPolygonAreaDisplayString([[0, 0], [1, 0], [1, 1]])).toBe('6181.86km²');
    });

    test('returns the area in square meters below a square kilometer hundredth', () => {
      expect(calcPolygonAreaDisplayString(SMALL_SQUARE)).toBe('4907.41m²');
    });

    test('accepts a ring the user already closed by returning to the first point', () => {
      expect(calcPolygonAreaDisplayString([[0, 0], [1, 0], [1, 1], [0, 0]])).toBe('6181.86km²');
    });

    test('returns null for a self-crossing ring rather than an area cancelled towards zero', () => {
      expect(calcPolygonAreaDisplayString([[0, 0], [1, 1], [1, 0], [0, 1]])).toBeNull();
    });

    test('returns null for a ring wrapping the globe, whose interior is ambiguous', () => {
      expect(calcPolygonAreaDisplayString([[0, 89], [90, 89], [180, 89], [-90, 89]])).toBeNull();
    });

    test('measures a ring straddling the antimeridian across it, not around the globe', () => {
      expect(calcPolygonAreaDisplayString([[179.9, 0], [-179.9, 0], [-179.9, 0.1], [179.9, 0.1]]))
        .toBe(calcPolygonAreaDisplayString([[0, 0], [0.2, 0], [0.2, 0.1], [0, 0.1]]));
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
