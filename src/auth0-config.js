// Auth0 configuration that varies by deployment environment.
//
// Production values are hard-coded here as the defaults. Non-production
// environments (staging, dev) override them via a Kubernetes ConfigMap
// mounted at /config.js, which sets window.__AUTH0_CONFIG__ before the
// app bundle loads. Local development overrides them via .env.development.

const PRODUCTION_DEFAULTS = {
  domain: 'auth.pamdas.org',
  clientId: 'FHoeQpdko5EMFU8JjjCzjPWT7k1sqm20',
  audience: 'https://pamdas.org/api',
};

const overrides = window.__AUTH0_CONFIG__ || {};

const auth0Config = {
  domain: overrides.domain || PRODUCTION_DEFAULTS.domain,
  clientId: overrides.clientId || PRODUCTION_DEFAULTS.clientId,
  audience: overrides.audience || PRODUCTION_DEFAULTS.audience,
};

export default auth0Config;
