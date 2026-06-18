import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { Provider } from 'react-redux';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import { thunk } from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import { useAuth0 } from '@auth0/auth0-react';

import Auth0TokenManager from './';
import RequireAccessToken from '../RequireAccessToken';
import tokenReducer from '../ducks/auth';
import systemConfigReducer from '../ducks/system-config';
import { GATE_RESULT, checkAccountLinked } from '../ducks/account-linking';
import useNavigate from '../hooks/useNavigate';

// Real router, real store, real react-redux. Mock only the genuine externals:
// the Auth0 SDK, the network gate call, the navigation hook (so we don't need
// NavigationContextProvider), and the presentational LoadingOverlay.
jest.mock('@auth0/auth0-react');
jest.mock('../hooks/useNavigate');
jest.mock('../ducks/account-linking', () => ({
  __esModule: true,
  ...jest.requireActual('../ducks/account-linking'),
  checkAccountLinked: jest.fn(),
}));
/* eslint-disable-next-line react/display-name */
jest.mock('../LoadingOverlay', () => () => <div data-testid="loading">Loading…</div>);

const VALID_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
const CALLBACK_ENTRY = '/?code=abc&state=xyz';

// --- The load-bearing assumption behind the no-bounce guarantee, verified directly ---
// hasAuth0Params is read from react-router's useLocation(). The Auth0 SDK strips
// ?code&state with a raw window.history.replaceState (no popstate). react-router
// only syncs on popstate / its own navigate(), so it never observes that strip —
// which is why the overlay holds and the user is never bounced to /login during
// the post-callback gate round-trip.
describe('react-router ignores the Auth0 SDK raw history.replaceState', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  test('useLocation retains ?code&state after a raw replaceState clears them', () => {
    window.history.replaceState({}, '', CALLBACK_ENTRY);

    const Probe = () => <div data-testid="search">{useLocation().search}</div>;
    render(<BrowserRouter><Probe /></BrowserRouter>);

    expect(screen.getByTestId('search').textContent).toBe('?code=abc&state=xyz');

    // Exactly what @auth0/auth0-react's default onRedirectCallback does.
    act(() => {
      window.history.replaceState({}, '', '/');
    });

    // Unchanged: react-router never saw it.
    expect(screen.getByTestId('search').textContent).toBe('?code=abc&state=xyz');
  });
});

// --- The integration the reviewer flagged: does the post-callback window bounce
// the user to /login (and clobber the deep link) before the gate resolves? ---
describe('post-callback account-linking gate', () => {
  let store;
  let mockNavigate;
  let mockGetAccessTokenSilently;
  let resolveGate;

  const setAuth0 = (overrides) => useAuth0.mockReturnValue({
    isLoading: false,
    isAuthenticated: false,
    getAccessTokenSilently: mockGetAccessTokenSilently,
    logout: jest.fn().mockResolvedValue(),
    ...overrides,
  });

  // Routes mirror index.js (REACT_APP_ROUTE_PREFIX === '/'). Auth0TokenManager
  // sits above the routes, exactly as in the real app.
  const tree = () => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[CALLBACK_ENTRY]}>
        <Auth0TokenManager />
        <Routes>
          <Route path="/login" element={<div>LOGIN PAGE</div>} />
          <Route
            path="/*"
            element={<RequireAccessToken><div>PROTECTED APP</div></RequireAccessToken>}
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

  beforeEach(() => {
    store = createStore(
      combineReducers({
        data: combineReducers({ token: tokenReducer }),
        view: combineReducers({ systemConfig: systemConfigReducer }),
      }),
      {
        data: { token: { access_token: null } },
        view: { systemConfig: { require_idp: true, idp_org_id: null } }, // common-DB site
      },
      applyMiddleware(thunk, promiseMiddleware),
    );

    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    mockGetAccessTokenSilently = jest.fn().mockResolvedValue(VALID_TOKEN);
    // Keep the gate pending so we can assert the in-flight window deterministically.
    checkAccountLinked.mockReturnValue(new Promise((resolve) => { resolveGate = resolve; }));

    // The deep link the user was headed to before Auth0 sent them round-trip.
    localStorage.setItem('er:intended_route', '/events/123');

    setAuth0({ isLoading: true, isAuthenticated: false });
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('holds the overlay through the gate, never bounces to /login or clobbers the deep link, then proceeds on 204', async () => {
    const { rerender } = render(tree());

    // Phase 1 — SDK still processing (isLoading): overlay, no bounce.
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByText('LOGIN PAGE')).not.toBeInTheDocument();
    expect(screen.queryByText('PROTECTED APP')).not.toBeInTheDocument();

    // Phase 2 — SDK done (isAuthenticated), gate in flight. ?code&state never
    // leave react-router's location (the SDK's raw replaceState is invisible to
    // it — see the sibling describe), so hasAuth0Params holds the overlay.
    setAuth0({ isLoading: false, isAuthenticated: true });
    await act(async () => { rerender(tree()); });

    await waitFor(() => {
      expect(checkAccountLinked).toHaveBeenCalledWith(VALID_TOKEN); // effect reached the gate
    });
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByText('LOGIN PAGE')).not.toBeInTheDocument(); // <- the bug, if it existed
    expect(store.getState().data.token.access_token).toBeNull();      // not authenticated yet
    expect(localStorage.getItem('er:intended_route')).toBe('/events/123'); // deep link intact
    expect(mockNavigate).not.toHaveBeenCalled();

    // Phase 3 — gate returns 204 (linked): enter the app and navigate to the
    // preserved deep link.
    await act(async () => { resolveGate({ result: GATE_RESULT.LINKED }); });

    await waitFor(() => {
      expect(store.getState().data.token.access_token).toBe(VALID_TOKEN);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/events/123', expect.objectContaining({ replace: true }));
    expect(localStorage.getItem('er:intended_route')).toBeNull();
  });
});
