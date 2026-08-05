import axios from 'axios';

import appConfig from '../../config';
import { DAS_HOST } from '../../constants';
import { clearResolvedIssuer, getResolvedIssuer } from '../../utils/auth';

export const PROTECTED_RESOURCE_URL = `${DAS_HOST}/.well-known/oauth-protected-resource`;

// Reserved registry key for the site's own authorization server. Its issuer is the site
// origin, which differs per site, so it is matched by predicate rather than by key.
const SELF = '$self';

const PROBE_TIMEOUT_MS = 3000;

export const REASON = {
  UNREACHABLE: 'unreachable',
  SITE_NOT_READY: 'site_not_ready',
  NO_USABLE_AS: 'no_usable_as',
};

// Both authorization servers are OAuth 2.0; the grant is the only thing that differs, and
// it is what the client dispatches on.
export const GRANT = {
  AUTHORIZATION_CODE: 'authorization_code',
  PASSWORD: 'password',
};

// Actions
export const SET_AUTH_DISCOVERY = 'AUTH_DISCOVERY.SET_AUTH_DISCOVERY';

// The probe answers before any token exists and must not inherit the app's Authorization
// header, cancel token, or 401-to-login handling. Built on first use rather than at import,
// so merely importing this module does not reach into axios.
let probeClient = null;
const getProbeClient = () => {
  if (!probeClient) probeClient = axios.create();
  return probeClient;
};

// RFC 8414 s2: an issuer identifier is a URL bearing no query or fragment. Scheme and host are
// case-insensitive and the parser folds those, along with a default port; the path is not, so
// lowercasing the whole string would equate issuers that differ -- too loose for the comparison
// deciding who this build authenticates against. The trailing slash Auth0 carries is not
// significant. Anything unparseable is no identity at all rather than a string that might
// collide with one.
const asIssuerIdentity = (value) => {
  let url;
  try {
    url = new URL(String(value).trim());
  } catch {
    return null;
  }

  if (url.search || url.hash) return null;

  return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
};

// Match on the origin boundary, not a bare prefix: a host that merely begins with this one
// (site.example.attacker.test) is a different site.
const isThisSite = (issuerIdentity) => {
  const origin = asIssuerIdentity(DAS_HOST);
  if (!origin) return false;

  return issuerIdentity === origin || issuerIdentity.startsWith(`${origin}/`);
};

// The issuer travels with the registration, and it is the registered key rather than the string
// that matched it: what reaches the Auth0 SDK as its domain is then a value this build holds,
// not one a site or a restored stash chose the spelling of.
const matchRegistration = (issuer, registry) => {
  const identity = asIssuerIdentity(issuer);
  if (!identity) return null;

  const literal = Object.entries(registry)
    .find(([key]) => key !== SELF && asIssuerIdentity(key) === identity);
  if (literal) return { ...literal[1], issuer: literal[0] };

  // $self is matched by predicate and holds no key to carry, so the normalised form stands in
  // -- still this module's own output rather than the site's spelling. Nothing external
  // consumes it: the password grant posts to a URL built from DAS_HOST.
  return registry[SELF] && isThisSite(identity)
    ? { ...registry[SELF], issuer: identity }
    : null;
};

// The registry is this build's trust policy, so resolution is a single pass over what the
// server advertised, in the server's order, taking the first issuer we hold a registration
// for. Falling past an unrecognized issuer is deliberate: Server emits Auth0 first, so a
// client that can use Auth0 always does, and reaching a later entry means the server named
// an authorization server this build cannot use while also naming one it can. Refusing then
// would decline a login the server sanctioned; `skipped` keeps the mismatch visible.
export const resolveAdvertised = (advertised, registry = appConfig.authorizationServers) => {
  const skipped = [];

  for (const issuer of advertised) {
    const registration = matchRegistration(issuer, registry);
    if (registration) return { ok: true, ...registration, skipped };
    skipped.push(issuer);
  }

  return { ok: false, reason: REASON.NO_USABLE_AS };
};

// RFC 9728 s3.3: a document whose resource is not the origin it was fetched from must be
// discarded. An ingress that does not route the well-known path answers with the SPA shell,
// so a 200 is not on its own evidence of a real document.
const readAuthorizationServers = (document) => {
  const resource = asIssuerIdentity(document?.resource);
  if (!resource || resource !== asIssuerIdentity(DAS_HOST)) return null;

  const authorizationServers = document.authorization_servers;
  if (!Array.isArray(authorizationServers) || !authorizationServers.length) return null;

  return authorizationServers;
};

// A site that answered but not usefully is an administrator's problem; one that did not
// answer at all may just be a bad moment.
const reasonFor = (error) => {
  const status = error?.response?.status;
  if (!status || status >= 500) return REASON.UNREACHABLE;
  return REASON.SITE_NOT_READY;
};

// The screen tells the reader one thing, because refreshing or finding an administrator is all
// they can do. Everything that would identify the cause is logged here, where it still exists.
const reportFailure = (reason, detail) => console.warn(
  'EarthRanger authorization discovery failed',
  { reason, probed: PROTECTED_RESOURCE_URL, ...detail },
);

// Action creators
export const fetchAuthDiscovery = ({ timeoutMs = PROBE_TIMEOUT_MS } = {}) => async (dispatch) => {
  // App startup waits on this probe, so a server that never answers is cut loose.
  const abortProbe = new AbortController();
  const deadline = setTimeout(() => abortProbe.abort(), timeoutMs);

  let discovery;
  try {
    const { data } = await getProbeClient().get(PROTECTED_RESOURCE_URL, { signal: abortProbe.signal });
    const advertised = readAuthorizationServers(data);

    if (!advertised) {
      discovery = { ok: false, reason: REASON.SITE_NOT_READY };
      reportFailure(discovery.reason, { resource: data?.resource, body: typeof data });
    } else {
      discovery = resolveAdvertised(advertised);
      if (!discovery.ok) {
        reportFailure(discovery.reason, {
          advertised,
          registered: Object.keys(appConfig.authorizationServers).filter((key) => key !== SELF),
        });
      }
    }
  } catch (error) {
    discovery = { ok: false, reason: reasonFor(error) };
    reportFailure(discovery.reason, { status: error?.response?.status, cause: error?.message });
  } finally {
    clearTimeout(deadline);
  }

  dispatch({ type: SET_AUTH_DISCOVERY, payload: discovery });
};

// Auth0Provider has to be mounted to exchange ?code&state, so the callback leg cannot wait on
// a live probe: a failure there would spend the code and bounce the user with nothing said.
// The issuer resolved before the redirect is read back instead and run through the same
// registry, so the trust policy gates the restored path exactly as it gates a probe result.
// Resolves false when there was nothing stashed, leaving the caller to probe as usual.
export const restoreAuthDiscovery = () => async (dispatch) => {
  const issuer = getResolvedIssuer();
  if (!issuer) return false;

  clearResolvedIssuer();

  const registration = matchRegistration(issuer, appConfig.authorizationServers);
  dispatch({
    type: SET_AUTH_DISCOVERY,
    payload: registration
      ? { ok: true, ...registration, skipped: [] }
      : { ok: false, reason: REASON.NO_USABLE_AS },
  });

  return true;
};

// Selectors
export const selectResolution = (state) => state.view.authDiscovery.discovery;

// The gate withholds the app unless discovery resolved, so anything rendered below it can
// rely on a resolution being present. Keeping the grant comparison here means callers cannot
// drift onto the wrong constant.
export const selectUsesRedirectGrant = (state) =>
  selectResolution(state)?.grant === GRANT.AUTHORIZATION_CODE;

// Reducer
export const INITIAL_STATE = {
  // Null while the probe is in flight; `settled` is what distinguishes that from a failure.
  discovery: null,
  settled: false,
};

const authDiscoveryReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case SET_AUTH_DISCOVERY:
    return { discovery: action.payload, settled: true };

  default:
    return state;
  }
};

export default authDiscoveryReducer;
