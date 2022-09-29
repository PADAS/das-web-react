import reportGeometryReducer, { setGeometryPoints } from './report-geometry';

describe('Ducks - Report geometry', () => {
  test('returns default state', () => {
    expect(reportGeometryReducer(undefined, { type: 'UNKNOWN' })).toEqual({ points: [] });
  });

  test('dispatches the SET_GEOMETRY_POINTS action', () => {
    const points = [[1, 2]];

    expect(reportGeometryReducer(undefined, setGeometryPoints(points))).toEqual({ points });
  });
});
