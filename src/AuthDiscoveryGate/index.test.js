import React from 'react';
import { Provider } from 'react-redux';

import authDiscoveryReducer, {
  fetchAuthDiscovery,
  INITIAL_STATE,
  REASON,
  restoreAuthDiscovery,
  SET_AUTH_DISCOVERY,
} from '../ducks/auth-discovery';
import systemConfigReducer, { SET_SYSTEM_CONFIG } from '../ducks/system-config';
import { fetchSystemStatus } from '../ducks/system-status';
import { mockStore } from '../__test-helpers/MockStore';
import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { render, screen, waitFor } from '../test-utils';

import AuthDiscoveryGate from './';

// A plain function component, not jest.fn: a jest.fn used as a component is invoked
// but renders nothing here, which would hide whether children reached the app.
const mockAuth0ProviderProps = [];

jest.mock('@auth0/auth0-react', () => ({
  Auth0Provider: (props) => {
    mockAuth0ProviderProps.push(props);
    return props.children;
  },
}));

jest.mock('../ducks/system-status', () => ({
  ...jest.requireActual('../ducks/system-status'),
  fetchSystemStatus: jest.fn(),
}));

jest.mock('../ducks/auth-discovery', () => ({
  __esModule: true,
  ...jest.requireActual('../ducks/auth-discovery'),
  fetchAuthDiscovery: jest.fn(),
  restoreAuthDiscovery: jest.fn(),
}));

// A known registry, so the "wrong build" copy is asserted against this fixture rather than
// against whatever the production defaults happen to hold.
jest.mock('../config', () => ({
  __esModule: true,
  default: {
    authorizationServers: {
      'https://auth.example.org/': {
        audience: 'https://api.example',
        clientId: 'exampleClientId',
        grant: 'authorization_code',
      },
      $self: { clientId: 'das_web_client', grant: 'password' },
    },
  },
}));

const AUTH0_RESOLUTION = {
  ok: true,
  issuer: 'https://auth.example.org/',
  audience: 'https://api.example',
  clientId: 'exampleClientId',
  grant: 'authorization_code',
  skipped: [],
};

const PASSWORD_RESOLUTION = {
  ok: true,
  issuer: 'http://localhost/oauth2',
  clientId: 'das_web_client',
  grant: 'password',
  skipped: [],
};

const PROTECTED_APP = 'the protected app';

// Both slices come from their real reducers rather than hand-written literals, so a change
// to either shape surfaces here instead of leaving these tests asserting against a shape
// production no longer has.
const LOADED_SYSTEM_CONFIG = systemConfigReducer(undefined, {
  type: SET_SYSTEM_CONFIG,
  payload: { require_idp: false },
});
const UNLOADED_SYSTEM_CONFIG = systemConfigReducer(undefined, {});

const renderGate = (discovery, systemConfig = LOADED_SYSTEM_CONFIG) => {
  const authDiscovery = discovery
    ? authDiscoveryReducer(INITIAL_STATE, { type: SET_AUTH_DISCOVERY, payload: discovery })
    : INITIAL_STATE;

  const store = mockStore({ view: { authDiscovery, systemConfig } });
  const utils = render(
    <Provider store={store}>
      <AuthDiscoveryGate><div>{PROTECTED_APP}</div></AuthDiscoveryGate>
    </Provider>
  );
  return { ...utils, store };
};

describe('AuthDiscoveryGate', () => {
  beforeEach(() => {
    mockAuth0ProviderProps.length = 0;
    fetchAuthDiscovery.mockImplementation(() => ({ type: 'PROBE_DISPATCHED' }));
    fetchSystemStatus.mockImplementation(() => () => Promise.resolve({}));
    restoreAuthDiscovery.mockImplementation(() => () => Promise.resolve(false));
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('probes for the site authorization server on mount', () => {
    const { store } = renderGate(null);

    expect(fetchAuthDiscovery).toHaveBeenCalledTimes(1);
    expect(store.getActions()).toEqual([{ type: 'PROBE_DISPATCHED' }]);
  });

  // Neither answer depends on the other, and startup waits on both. Firing them in series
  // would double time-to-login for no reason.
  test('puts the probe and the system-status fetch in flight together', () => {
    renderGate(null, UNLOADED_SYSTEM_CONFIG);

    expect(fetchAuthDiscovery).toHaveBeenCalledTimes(1);
    expect(fetchSystemStatus).toHaveBeenCalledTimes(1);
  });

  test('withholds the app until system config has loaded, even once discovery has settled', () => {
    renderGate(AUTH0_RESOLUTION, UNLOADED_SYSTEM_CONFIG);

    expect(screen.queryByText(PROTECTED_APP)).not.toBeInTheDocument();
    expect(mockAuth0ProviderProps).toHaveLength(0);
  });

  describe('returning from the Auth0 redirect', () => {
    const arriveOnCallback = () => window.history.replaceState({}, '', '/?code=abc&state=xyz');

    test('takes the resolution stashed before the redirect rather than probing again', async () => {
      arriveOnCallback();
      restoreAuthDiscovery.mockImplementation(() => () => Promise.resolve(true));

      renderGate(null);

      await waitFor(() => expect(restoreAuthDiscovery).toHaveBeenCalledTimes(1));
      expect(fetchAuthDiscovery).not.toHaveBeenCalled();
    });

    test('probes when the callback leg has no stashed resolution to fall back on', async () => {
      arriveOnCallback();

      renderGate(null);

      await waitFor(() => expect(fetchAuthDiscovery).toHaveBeenCalledTimes(1));
    });

    test('probes normally when this is not a callback leg, stash or no stash', async () => {
      restoreAuthDiscovery.mockImplementation(() => () => Promise.resolve(true));

      renderGate(null);

      await waitFor(() => expect(fetchAuthDiscovery).toHaveBeenCalledTimes(1));
      expect(restoreAuthDiscovery).not.toHaveBeenCalled();
    });
  });

  test('withholds the app until the probe settles', () => {
    renderGate(null);

    expect(screen.queryByText(PROTECTED_APP)).not.toBeInTheDocument();
    expect(mockAuth0ProviderProps).toHaveLength(0);
  });

  test('builds the Auth0 provider from the resolved registration', () => {
    renderGate(AUTH0_RESOLUTION);

    expect(screen.getByText(PROTECTED_APP)).toBeVisible();
    expect(mockAuth0ProviderProps[0]).toEqual(expect.objectContaining({
      clientId: AUTH0_RESOLUTION.clientId,
      domain: 'auth.example.org',
      authorizationParams: expect.objectContaining({
        audience: AUTH0_RESOLUTION.audience,
        redirect_uri: `${window.location.origin}${REACT_APP_ROUTE_PREFIX}`,
      }),
    }));
  });

  test('mounts no Auth0 provider at all when the grant is password', () => {
    renderGate(PASSWORD_RESOLUTION);

    expect(screen.getByText(PROTECTED_APP)).toBeVisible();
    expect(mockAuth0ProviderProps).toHaveLength(0);
  });

  test.each([
    REASON.UNREACHABLE,
    REASON.SITE_NOT_READY,
    REASON.NO_USABLE_AS,
  ])('withholds the app when discovery fails with %s', (reason) => {
    renderGate({ ok: false, reason });

    expect(screen.queryByText(PROTECTED_APP)).not.toBeInTheDocument();
    expect(mockAuth0ProviderProps).toHaveLength(0);
  });

  // Every reason reads the same to whoever is looking at it: this site cannot say how to sign
  // them in. Which reason it was matters to whoever debugs it, and that goes to the console.
  test.each([
    REASON.UNREACHABLE,
    REASON.SITE_NOT_READY,
    REASON.NO_USABLE_AS,
  ])('says the same thing for %s, since the reader can only refresh or ask someone', (reason) => {
    renderGate({ ok: false, reason });

    expect(screen.getByText(/could not work out how to sign you in/i)).toBeVisible();
  });

  test('offers no details widget, because the diagnosis is not the reader\'s to act on', () => {
    renderGate({ ok: false, reason: REASON.SITE_NOT_READY });

    expect(screen.queryByRole('button', { name: /details/i })).not.toBeInTheDocument();
  });
});
