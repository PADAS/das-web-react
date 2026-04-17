describe('appConfig', () => {
  const PRODUCTION_DEFAULTS = {
    auth0: {
      audience: 'https://pamdas.org/api',
      clientId: 'FHoeQpdko5EMFU8JjjCzjPWT7k1sqm20',
      domain: 'auth.pamdas.org',
    },
  };

  afterEach(() => {
    delete window.__APP_CONFIG__;
    jest.resetModules();
  });

  test('returns production defaults when no override is set', () => {
    const { default: appConfig } = require('./config');

    expect(appConfig).toEqual(PRODUCTION_DEFAULTS);
  });

  test('returns production defaults when window.__APP_CONFIG__ is empty', () => {
    window.__APP_CONFIG__ = {};

    const { default: appConfig } = require('./config');

    expect(appConfig).toEqual(PRODUCTION_DEFAULTS);
  });

  test('returns production defaults when nested group is empty', () => {
    window.__APP_CONFIG__ = { auth0: {} };

    const { default: appConfig } = require('./config');

    expect(appConfig).toEqual(PRODUCTION_DEFAULTS);
  });

  test('overrides all properties when full override is provided', () => {
    const override = {
      auth0: {
        audience: 'https://dev.pamdas.org/api',
        clientId: 'devClientId123',
        domain: 'auth-dev.pamdas.org',
      },
    };
    window.__APP_CONFIG__ = override;

    const { default: appConfig } = require('./config');

    expect(appConfig).toEqual(override);
  });

  test('overrides a single nested property while preserving other defaults', () => {
    window.__APP_CONFIG__ = { auth0: { domain: 'auth-staging.pamdas.org' } };

    const { default: appConfig } = require('./config');

    expect(appConfig).toEqual({
      auth0: {
        audience: PRODUCTION_DEFAULTS.auth0.audience,
        clientId: PRODUCTION_DEFAULTS.auth0.clientId,
        domain: 'auth-staging.pamdas.org',
      },
    });
  });

  test('ignores unrecognized top-level keys', () => {
    window.__APP_CONFIG__ = { unknownSection: { foo: 'bar' } };

    const { default: appConfig } = require('./config');

    expect(appConfig).toEqual(PRODUCTION_DEFAULTS);
    expect(appConfig).not.toHaveProperty('unknownSection');
  });

  test('ignores unrecognized keys within a known group', () => {
    window.__APP_CONFIG__ = { auth0: { domain: 'auth-dev.pamdas.org', unknownKey: 'value' } };

    const { default: appConfig } = require('./config');

    expect(appConfig.auth0.domain).toBe('auth-dev.pamdas.org');
    expect(appConfig.auth0).not.toHaveProperty('unknownKey');
  });
});
