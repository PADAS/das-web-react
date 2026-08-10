// App configuration that varies by deployment environment.
//
// Production values are hard-coded here as the defaults. Non-production
// environments override via /config.js, which sets window.__APP_CONFIG__
// before the app bundle loads. In deployed environments this file is
// provided by a Kubernetes ConfigMap; for local development, copy
// public/config.js.example to public/config.js.

// authorizationServers is this build's client registry, keyed by the RFC 8414 issuer
// identifier a site advertises in its RFC 9728 metadata. It is also the trust policy:
// a site naming an issuer absent from the map holds no registration here and cannot be
// authenticated against, so an override replaces the map wholesale instead of merging
// into it — a non-production build must not go on trusting the production tenant.
//
// $self is the reserved key for the site's own authorization server, django-oauth-toolkit
// serving /oauth2/token. Its issuer is the site origin, which differs per site and so
// cannot be written as a literal; it is matched by predicate instead. Omitting it builds
// a client that holds no password registration at all.
const PRODUCTION_DEFAULTS = {
  authorizationServers: {
    'https://auth.pamdas.org/': {
      audience: 'https://pamdas.org/api',
      clientId: 'FHoeQpdko5EMFU8JjjCzjPWT7k1sqm20',
      grant: 'authorization_code',
    },
    $self: {
      clientId: 'das_web_client',
      grant: 'password',
    },
  },
};

const overrides = window.__APP_CONFIG__ ?? {};

const appConfig = {
  authorizationServers: overrides.authorizationServers ?? PRODUCTION_DEFAULTS.authorizationServers,
};

export default appConfig;
