import { mockStore } from '../__test-helpers/MockStore';

import reportGeometryReducer, { setGeometryPoints } from './report-geometry';

describe('Ducks - Report geometry', () => {
  let store;
  beforeEach(() => {
    store = mockStore({});
  });

  test('returns default state', () => {
    store.dispatch({ type: 'UNKNOWN' });

    const actions = store.getActions();

    expect(reportGeometryReducer(undefined, actions[0]).current).toEqual({ points: [] });
  });

  test('dispatches the SET_GEOMETRY_POINTS action', () => {
    const points = [[1, 2]];

    store.dispatch(setGeometryPoints(points));

    const actions = store.getActions();

    expect(actions[0].type).toEqual('SET_GEOMETRY_POINTS');
    expect(actions[0].payload).toEqual({ points });
    expect(reportGeometryReducer(undefined, actions[0]).current).toEqual({ points });
  });
});
