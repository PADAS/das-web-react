import reportGeometryReducer, { reset, setGeometryPoints, undo } from './report-geometry';

describe('Ducks - Report geometry', () => {
  test('returns default state', () => {
    expect(reportGeometryReducer(undefined, { type: 'UNKNOWN' })).toEqual({
      current: { points: [] },
      future: [],
      past: [],
    });
  });

  test('sets the geometry points', () => {
    const points = [[1, 2]];

    expect(reportGeometryReducer(undefined, setGeometryPoints(points))).toEqual({
      current: { points },
      future: [],
      past: [{ points: [] }],
    });
  });

  test('undoes a points change', () => {
    const points = [[1, 2]];

    const state = reportGeometryReducer(undefined, setGeometryPoints(points));

    expect(reportGeometryReducer(state, undo())).toEqual({
      current: { points: [] },
      future: [{ points }],
      past: [],
    });
  });

  test('resets the history', () => {
    const points = [[1, 2]];

    const state = reportGeometryReducer(undefined, setGeometryPoints(points));

    expect(reportGeometryReducer(state, reset())).toEqual({
      current: { points },
      future: [],
      past: [],
    });
  });
});
