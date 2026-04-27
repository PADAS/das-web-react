// App configuration that varies by deployment environment.
//
// Production values are hard-coded here as the defaults. Non-production
// environments override via /config.js, which sets window.__APP_CONFIG__
// before the app bundle loads. In deployed environments this file is
// provided by a Kubernetes ConfigMap; for local development, copy
// public/config.js.example to public/config.js.

const PRODUCTION_DEFAULTS = {
  auth0: {
    audience: 'https://pamdas.org/api',
    clientId: 'FHoeQpdko5EMFU8JjjCzjPWT7k1sqm20',
    domain: 'auth.pamdas.org',
  },
};

const overrides = window.__APP_CONFIG__ ?? {};

const appConfig = {
  auth0: {
    audience: overrides.auth0?.audience ?? PRODUCTION_DEFAULTS.auth0.audience,
    clientId: overrides.auth0?.clientId ?? PRODUCTION_DEFAULTS.auth0.clientId,
    domain: overrides.auth0?.domain ?? PRODUCTION_DEFAULTS.auth0.domain,
  },
};

export default appConfig;
