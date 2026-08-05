import store from './store';
import { INITIAL_STATE as AUTH_DISCOVERY_INITIAL_STATE } from './ducks/auth-discovery';

describe('store', () => {
  // Components read these slices straight off the state tree. A duck that is written, tested
  // and rendered but never wired into the root reducer throws on first access, and no test
  // that builds its own store with mockStore can see that.
  test('exposes the auth-discovery slice the startup gate reads', () => {
    expect(store.getState().view.authDiscovery).toEqual(AUTH_DISCOVERY_INITIAL_STATE);
  });

  test('leaves auth discovery unpersisted, so a stale authorization decision cannot survive a reload', () => {
    expect(store.getState().view.authDiscovery).not.toHaveProperty('_persist');
    expect(store.getState().view.systemConfig).not.toHaveProperty('_persist');
  });
});
