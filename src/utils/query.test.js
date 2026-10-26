import { isBboxContainedBy } from './query';

describe('utils - query', () => {
  describe('isBboxContainedBy', () => {
    const CONTAINER = '-10,-10,10,10';

    test('reports a viewport strictly inside the container as contained', () => {
      expect(isBboxContainedBy('-5,-5,5,5', CONTAINER)).toBe(true);
    });

    test('reports an identical viewport as contained', () => {
      expect(isBboxContainedBy(CONTAINER, CONTAINER)).toBe(true);
    });

    test('reports a viewport sharing an edge with the container as contained', () => {
      expect(isBboxContainedBy('-10,-5,5,5', CONTAINER)).toBe(true);
    });

    test('does not report a viewport that overlaps only partially as contained', () => {
      expect(isBboxContainedBy('5,5,15,15', CONTAINER)).toBe(false);
    });

    test('does not report a viewport larger than the container as contained', () => {
      expect(isBboxContainedBy('-20,-20,20,20', CONTAINER)).toBe(false);
    });

    test('does not report a viewport beyond a single edge as contained', () => {
      expect(isBboxContainedBy('-5,-5,10.0001,5', CONTAINER)).toBe(false);
    });

    test('does not report containment when there is no container', () => {
      expect(isBboxContainedBy('-5,-5,5,5', undefined)).toBe(false);
      expect(isBboxContainedBy('-5,-5,5,5', null)).toBe(false);
    });

    test('does not report containment when a bbox is malformed', () => {
      expect(isBboxContainedBy('-5,-5,5', CONTAINER)).toBe(false);
      expect(isBboxContainedBy('a,b,c,d', CONTAINER)).toBe(false);
    });

    test('does not report containment when either bbox wraps the antimeridian', () => {
      expect(isBboxContainedBy('170,-5,-170,5', '160,-10,-160,10')).toBe(false);
      expect(isBboxContainedBy('-5,-5,5,5', '10,-10,-10,10')).toBe(false);
    });
  });
});
