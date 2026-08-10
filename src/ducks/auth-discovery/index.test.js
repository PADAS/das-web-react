import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { DAS_HOST } from '../../constants';
import { getResolvedIssuer, setResolvedIssuer } from '../../utils/auth';
import { mockStore } from '../../__test-helpers/MockStore';

import authDiscoveryReducer, {
  fetchAuthDiscovery,
  INITIAL_STATE,
  PROTECTED_RESOURCE_URL,
  REASON,
  resolveAdvertised,
  restoreAuthDiscovery,
  selectResolution,
  selectUsesRedirectGrant,
  SET_AUTH_DISCOVERY,
} from './';

// RFC 8414 issuer identifiers as EarthRanger Server advertises them: the Auth0 tenant by
// its custom domain, the site's own server by django-oauth-toolkit's OIDC issuer. Server
// emits Auth0 first, so a client that can use it always does.
const AUTH0_AUTHORIZATION_SERVER = 'https://auth.example.org/';
const SELF_AUTHORIZATION_SERVER = `${DAS_HOST}/oauth2`;
const FOREIGN_AUTHORIZATION_SERVER = 'https://auth.someone-elses-tenant.example/';

const AUTH0_REGISTRATION = {
  audience: 'https://api.example',
  clientId: 'exampleClientId',
  grant: 'authorization_code',
};

const SELF_REGISTRATION = { clientId: 'das_web_client', grant: 'password' };

jest.mock('../../config', () => ({
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

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const respond = (resolver) => server.use(http.get(PROTECTED_RESOURCE_URL, resolver));

const respondWith = (body) => respond(() => HttpResponse.json(body));

const advertise = (authorizationServers) => respondWith({ resource: DAS_HOST, authorization_servers: authorizationServers });

const probe = async (options) => {
  const store = mockStore({});
  await store.dispatch(fetchAuthDiscovery(options));
  return store.getActions()[0].payload;
};

describe('Ducks - Auth discovery', () => {
  describe('resolving an advertised authorization server', () => {
    test('takes the Auth0 registration on a fully migrated site', async () => {
      advertise([AUTH0_AUTHORIZATION_SERVER]);

      expect(await probe()).toEqual({
        ok: true,
        issuer: AUTH0_AUTHORIZATION_SERVER,
        skipped: [],
        ...AUTH0_REGISTRATION,
      });
    });

    test('takes Auth0 over the site own server when both are advertised, on advertised order', async () => {
      advertise([AUTH0_AUTHORIZATION_SERVER, SELF_AUTHORIZATION_SERVER]);

      expect(await probe()).toMatchObject({ ok: true, grant: 'authorization_code', skipped: [] });
    });

    test('takes the password registration on a site advertising only its own server', async () => {
      advertise([SELF_AUTHORIZATION_SERVER]);

      expect(await probe()).toEqual({
        ok: true,
        issuer: SELF_AUTHORIZATION_SERVER,
        skipped: [],
        ...SELF_REGISTRATION,
      });
    });

    test('falls through an unrecognized issuer to the site own server, recording what it skipped', async () => {
      // The real shape of a tenant mismatch: Server emits Auth0 first, this build has no
      // registration for that tenant, and the site still accepts its own tokens.
      advertise([FOREIGN_AUTHORIZATION_SERVER, SELF_AUTHORIZATION_SERVER]);

      expect(await probe()).toEqual({
        ok: true,
        issuer: SELF_AUTHORIZATION_SERVER,
        skipped: [FOREIGN_AUTHORIZATION_SERVER],
        ...SELF_REGISTRATION,
      });
    });

    test('reaches no usable authorization server when nothing advertised has a registration', async () => {
      advertise([FOREIGN_AUTHORIZATION_SERVER]);

      expect(await probe()).toEqual({ ok: false, reason: REASON.NO_USABLE_AS });
    });

    test('does not treat a host that merely begins with this site host as the site own server', async () => {
      advertise([`${DAS_HOST}.somewhere-else.example/oauth2`]);

      expect(await probe()).toEqual({ ok: false, reason: REASON.NO_USABLE_AS });
    });

    test('resolves trailing-slash and letter-case variants identically', async () => {
      advertise(['HTTPS://AUTH.EXAMPLE.ORG']);

      expect(await probe()).toMatchObject({ ok: true, ...AUTH0_REGISTRATION });
    });
  });

  describe('comparing issuer identifiers', () => {
    const pathBearing = { 'https://auth.example.org/tenant/one': AUTH0_REGISTRATION };

    test('holds the path case-sensitive while scheme and host are not', () => {
      expect(resolveAdvertised(['https://auth.example.org/Tenant/One'], pathBearing))
        .toEqual({ ok: false, reason: REASON.NO_USABLE_AS });

      expect(resolveAdvertised(['HTTPS://AUTH.EXAMPLE.ORG/tenant/one'], pathBearing))
        .toMatchObject({ ok: true, ...AUTH0_REGISTRATION });
    });

    test('reads the default port as absent', () => {
      expect(resolveAdvertised(['https://auth.example.org:443/'])).toMatchObject({ ok: true, ...AUTH0_REGISTRATION });
    });

    test('refuses an issuer carrying a query or a fragment', () => {
      expect(resolveAdvertised([`${AUTH0_AUTHORIZATION_SERVER}?tenant=other`]))
        .toEqual({ ok: false, reason: REASON.NO_USABLE_AS });

      expect(resolveAdvertised([`${AUTH0_AUTHORIZATION_SERVER}#other`]))
        .toEqual({ ok: false, reason: REASON.NO_USABLE_AS });
    });

    test('refuses an advertised entry that is not a URL', () => {
      expect(resolveAdvertised(['not-a-url', ''])).toEqual({ ok: false, reason: REASON.NO_USABLE_AS });
    });

    test('carries the registered issuer, not the spelling the site advertised', async () => {
      advertise(['HTTPS://AUTH.EXAMPLE.ORG']);

      expect(await probe()).toMatchObject({ ok: true, issuer: AUTH0_AUTHORIZATION_SERVER });
    });

    test('carries the advertised issuer for the site own server, which the registry names by predicate', async () => {
      advertise([SELF_AUTHORIZATION_SERVER]);

      expect(await probe()).toMatchObject({ ok: true, issuer: SELF_AUTHORIZATION_SERVER });
    });
  });

  describe('resolveAdvertised against a registry holding no $self', () => {
    const withoutSelf = { [AUTH0_AUTHORIZATION_SERVER]: AUTH0_REGISTRATION };

    test('refuses the password grant outright on a site advertising only its own server', () => {
      expect(resolveAdvertised([SELF_AUTHORIZATION_SERVER], withoutSelf))
        .toEqual({ ok: false, reason: REASON.NO_USABLE_AS });
    });

    test('still resolves a registered Auth0 issuer', () => {
      expect(resolveAdvertised([AUTH0_AUTHORIZATION_SERVER], withoutSelf))
        .toMatchObject({ ok: true, grant: 'authorization_code' });
    });
  });

  describe('the site is not ready to be discovered', () => {
    test('when the endpoint is absent, as on a server predating it', async () => {
      respond(() => new HttpResponse(null, { status: 404 }));

      expect(await probe()).toEqual({ ok: false, reason: REASON.SITE_NOT_READY });
    });

    test('when an ingress that does not route the path serves the SPA shell instead', async () => {
      respond(() => HttpResponse.html('<!doctype html><title>EarthRanger</title>'));

      expect(await probe()).toEqual({ ok: false, reason: REASON.SITE_NOT_READY });
    });

    test('when the resource identifier is not the origin the document was fetched from', async () => {
      respondWith({
        resource: 'https://another-site.example',
        authorization_servers: [AUTH0_AUTHORIZATION_SERVER],
      });

      expect(await probe()).toEqual({ ok: false, reason: REASON.SITE_NOT_READY });
    });

    test('when authorization_servers is absent', async () => {
      respondWith({ resource: DAS_HOST });

      expect(await probe()).toEqual({ ok: false, reason: REASON.SITE_NOT_READY });
    });

    test('when authorization_servers is not an array', async () => {
      respondWith({ resource: DAS_HOST, authorization_servers: AUTH0_AUTHORIZATION_SERVER });

      expect(await probe()).toEqual({ ok: false, reason: REASON.SITE_NOT_READY });
    });

    test('when authorization_servers is empty, which advertises nothing rather than a legacy site', async () => {
      advertise([]);

      expect(await probe()).toEqual({ ok: false, reason: REASON.SITE_NOT_READY });
    });
  });

  describe('the site cannot be reached', () => {
    test('when the request fails outright', async () => {
      respond(() => HttpResponse.error());

      expect(await probe()).toEqual({ ok: false, reason: REASON.UNREACHABLE });
    });

    test('when the server errors', async () => {
      respond(() => new HttpResponse(null, { status: 503 }));

      expect(await probe()).toEqual({ ok: false, reason: REASON.UNREACHABLE });
    });

    test('when the response outlasts the timeout', async () => {
      respond(async () => {
        await delay(100);
        return HttpResponse.json({ resource: DAS_HOST, authorization_servers: [AUTH0_AUTHORIZATION_SERVER] });
      });

      expect(await probe({ timeoutMs: 20 })).toEqual({ ok: false, reason: REASON.UNREACHABLE });
    });
  });

  describe('reporting a failure for diagnosis', () => {
    let warn;

    beforeEach(() => {
      warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => warn.mockRestore());

    test('logs the reason and what it probed, which is more than a screen can carry', async () => {
      respond(() => new HttpResponse(null, { status: 404 }));

      await probe();

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('authorization discovery'),
        expect.objectContaining({
          reason: REASON.SITE_NOT_READY,
          probed: PROTECTED_RESOURCE_URL,
          status: 404,
        }),
      );
    });

    test('names the issuers it holds registrations for when none advertised is usable', async () => {
      advertise([FOREIGN_AUTHORIZATION_SERVER]);

      await probe();

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('authorization discovery'),
        expect.objectContaining({
          reason: REASON.NO_USABLE_AS,
          advertised: [FOREIGN_AUTHORIZATION_SERVER],
          registered: [AUTH0_AUTHORIZATION_SERVER],
        }),
      );
    });

    test('stays quiet when discovery succeeds', async () => {
      advertise([AUTH0_AUTHORIZATION_SERVER]);

      await probe();

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('restoring a resolution stashed across the Auth0 redirect', () => {
    beforeEach(() => sessionStorage.clear());
    afterEach(() => sessionStorage.clear());

    const restore = async () => {
      const store = mockStore({});
      const restored = await store.dispatch(restoreAuthDiscovery());
      return { restored, actions: store.getActions() };
    };

    test('resolves the stashed issuer through the registry, without probing', async () => {
      setResolvedIssuer(AUTH0_AUTHORIZATION_SERVER);

      const { restored, actions } = await restore();

      expect(restored).toBe(true);
      expect(actions).toEqual([{
        type: SET_AUTH_DISCOVERY,
        payload: { ok: true, issuer: AUTH0_AUTHORIZATION_SERVER, skipped: [], ...AUTH0_REGISTRATION },
      }]);
    });

    test('does nothing when no issuer was stashed', async () => {
      const { restored, actions } = await restore();

      expect(restored).toBe(false);
      expect(actions).toEqual([]);
    });

    // The stash carries a key, never a registration, so the trust policy still gates it.
    test('refuses a stashed issuer this build holds no registration for', async () => {
      setResolvedIssuer(FOREIGN_AUTHORIZATION_SERVER);

      const { restored, actions } = await restore();

      expect(restored).toBe(true);
      expect(actions).toEqual([{
        type: SET_AUTH_DISCOVERY,
        payload: { ok: false, reason: REASON.NO_USABLE_AS },
      }]);
    });

    test('resolves a stashed issuer back to the registered spelling', async () => {
      setResolvedIssuer('HTTPS://AUTH.EXAMPLE.ORG');

      const { actions } = await restore();

      expect(actions[0].payload).toMatchObject({ ok: true, issuer: AUTH0_AUTHORIZATION_SERVER });
    });

    test('clears the stash once consumed, so it cannot serve a later attempt', async () => {
      setResolvedIssuer(AUTH0_AUTHORIZATION_SERVER);

      await restore();

      expect(getResolvedIssuer()).toBeNull();
    });
  });

  describe('selectors', () => {
    const stateFor = (discovery) => ({
      view: {
        authDiscovery: discovery
          ? authDiscoveryReducer(INITIAL_STATE, { type: SET_AUTH_DISCOVERY, payload: discovery })
          : INITIAL_STATE,
      },
    });

    const AUTH0 = { ok: true, issuer: AUTH0_AUTHORIZATION_SERVER, skipped: [], ...AUTH0_REGISTRATION };
    const SELF = { ok: true, issuer: SELF_AUTHORIZATION_SERVER, skipped: [], ...SELF_REGISTRATION };

    test('selectResolution exposes the resolution consumers read', () => {
      expect(selectResolution(stateFor(AUTH0))).toEqual(AUTH0);
    });

    test('selectResolution is null while the probe is in flight', () => {
      expect(selectResolution(stateFor(null))).toBeNull();
    });

    test('selectUsesRedirectGrant is true for the authorization_code grant', () => {
      expect(selectUsesRedirectGrant(stateFor(AUTH0))).toBe(true);
    });

    test('selectUsesRedirectGrant is false for the password grant', () => {
      expect(selectUsesRedirectGrant(stateFor(SELF))).toBe(false);
    });

    test('selectUsesRedirectGrant is false before the probe has resolved', () => {
      expect(selectUsesRedirectGrant(stateFor(null))).toBe(false);
    });

    test('selectUsesRedirectGrant is false when discovery failed', () => {
      expect(selectUsesRedirectGrant(stateFor({ ok: false, reason: REASON.UNREACHABLE }))).toBe(false);
    });
  });

  describe('authDiscoveryReducer', () => {
    test('starts out unsettled, holding no discovery', () => {
      expect(authDiscoveryReducer(undefined, {})).toEqual({ discovery: null, settled: false });
    });

    test('records a resolution', () => {
      const discovery = {
        ok: true,
        issuer: AUTH0_AUTHORIZATION_SERVER,
        skipped: [],
        ...AUTH0_REGISTRATION,
      };

      expect(authDiscoveryReducer(INITIAL_STATE, { type: SET_AUTH_DISCOVERY, payload: discovery }))
        .toEqual({ discovery, settled: true });
    });

    test('records a failure, which is distinct from a probe still in flight', () => {
      const discovery = { ok: false, reason: REASON.SITE_NOT_READY };

      expect(authDiscoveryReducer(INITIAL_STATE, { type: SET_AUTH_DISCOVERY, payload: discovery }))
        .toEqual({ discovery, settled: true });
    });
  });
});
