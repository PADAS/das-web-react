describe('auth0Config', () => {
  const PRODUCTION_DEFAULTS = {
    domain: 'auth.pamdas.org',
    clientId: 'FHoeQpdko5EMFU8JjjCzjPWT7k1sqm20',
    audience: 'https://pamdas.org/api',
  };

  afterEach(() => {
    delete window.__AUTH0_CONFIG__;
    jest.resetModules();
  });

  test('returns production defaults when no override is set', () => {
    const { default: auth0Config } = require('./auth0-config');

    expect(auth0Config).toEqual(PRODUCTION_DEFAULTS);
  });

  test('returns overrides from window.__AUTH0_CONFIG__ when set', () => {
    const override = {
      domain: 'auth-dev.pamdas.org',
      clientId: 'devClientId123',
      audience: 'https://dev.pamdas.org/api',
    };
    window.__AUTH0_CONFIG__ = override;

    const { default: auth0Config } = require('./auth0-config');

    expect(auth0Config).toEqual(override);
  });

  test('falls back to production defaults for missing override properties', () => {
    window.__AUTH0_CONFIG__ = { domain: 'auth-staging.pamdas.org' };

    const { default: auth0Config } = require('./auth0-config');

    expect(auth0Config).toEqual({
      domain: 'auth-staging.pamdas.org',
      clientId: PRODUCTION_DEFAULTS.clientId,
      audience: PRODUCTION_DEFAULTS.audience,
    });
  });
});
