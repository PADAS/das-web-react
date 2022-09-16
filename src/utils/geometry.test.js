import { validateEventPolygonPoints } from './geometry';

describe('#validateEventPolygonPoints', () => {
  test('failing polygons if turf rejects their points as a valid polygon', () => {
    const badPolygonPoints = [[[null, 'banana'], [true, 'wee'], ['meow', 'wow']]];

    expect(validateEventPolygonPoints(badPolygonPoints)).toBe(false);
  });

  test('failing polygons if they are valid but have intersecting lines', () => {
    const goodPolygonPointsWithLineIntersection = [
      [
        53.78906249999999,
        44.74673324024678
      ],
      [
        47.7685546875,
        48.516604348867475
      ],
      [
        63.4130859375,
        50.28933925329178
      ],
      [
        53.9208984375,
        53.64463782485651
      ],
      [
        53.78906249999999,
        44.74673324024678
      ]
    ];

    expect(validateEventPolygonPoints(goodPolygonPointsWithLineIntersection)).toBe(false);
  });

  test('passing polygons if they are valid polygons with no intersecting lines', () => {
    const validEventPolygonPoints = [
      [
        51.767578125,
        45.73685954736049
      ],
      [
        57.83203125,
        45.73685954736049
      ],
      [
        57.83203125,
        50.233151832472245
      ],
      [
        51.767578125,
        50.233151832472245
      ],
      [
        51.767578125,
        45.73685954736049
      ]
    ];

    expect(validateEventPolygonPoints(validEventPolygonPoints)).toBe(true);
  });
});