describe('appConfig', () => {
  const PRODUCTION_AUTHORIZATION_SERVER = 'https://auth.pamdas.org/';

  const PRODUCTION_DEFAULTS = {
    // The scalar audience/clientId/domain are still read by the Auth0 provider and the
    // login paths, and remain until those read the registration discovery resolves.
    auth0: {
      audience: 'https://pamdas.org/api',
      clientId: 'FHoeQpdko5EMFU8JjjCzjPWT7k1sqm20',
      domain: 'auth.pamdas.org',
    },
    authorizationServers: {
      [PRODUCTION_AUTHORIZATION_SERVER]: {
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

  test('carries a grant type on every registration, and no audience on the DAS one', () => {
    const { default: appConfig } = require('./config');

    const { authorizationServers } = appConfig;
    expect(authorizationServers[PRODUCTION_AUTHORIZATION_SERVER].grant).toBe('authorization_code');
    expect(authorizationServers.$self).toEqual({ clientId: 'das_web_client', grant: 'password' });
    // django-oauth-toolkit does not accept an audience, so the DAS entry must not carry one.
    expect(authorizationServers.$self).not.toHaveProperty('audience');
  });

  test('replaces the trusted authorization servers rather than merging them, so a non-production build does not keep trusting the production tenant', () => {
    const override = {
      authorizationServers: {
        'https://auth-dev.pamdas.org/': {
          audience: 'https://dev.pamdas.org/api',
          clientId: 'devClientId123',
          grant: 'authorization_code',
        },
        $self: { clientId: 'das_web_client', grant: 'password' },
      },
    };
    window.__APP_CONFIG__ = override;

    const { default: appConfig } = require('./config');

    expect(appConfig.authorizationServers).toEqual(override.authorizationServers);
    expect(appConfig.authorizationServers).not.toHaveProperty(PRODUCTION_AUTHORIZATION_SERVER);
  });

  test('accepts several trusted authorization servers, each with its own client registration', () => {
    window.__APP_CONFIG__ = {
      authorizationServers: {
        'https://auth.pamdas.org/': { audience: 'https://pamdas.org/api', clientId: 'prodClient', grant: 'authorization_code' },
        'https://auth-us.pamdas.org/': { audience: 'https://us.pamdas.org/api', clientId: 'usClient', grant: 'authorization_code' },
      },
    };

    const { default: appConfig } = require('./config');

    expect(Object.keys(appConfig.authorizationServers)).toEqual([
      'https://auth.pamdas.org/',
      'https://auth-us.pamdas.org/',
    ]);
  });

  test('lets an override omit $self, building a client that holds no password registration', () => {
    window.__APP_CONFIG__ = {
      authorizationServers: {
        'https://auth-dev.pamdas.org/': { audience: 'a', clientId: 'c', grant: 'authorization_code' },
      },
    };

    const { default: appConfig } = require('./config');

    expect(appConfig.authorizationServers).not.toHaveProperty('$self');
  });

  test('falls back to defaults when the override supplies no authorization servers', () => {
    window.__APP_CONFIG__ = { authorizationServers: null };

    const { default: appConfig } = require('./config');

    expect(appConfig.authorizationServers).toEqual(PRODUCTION_DEFAULTS.authorizationServers);
  });

  test('ignores unrecognized top-level keys', () => {
    window.__APP_CONFIG__ = { unknownSection: { foo: 'bar' } };

    const { default: appConfig } = require('./config');

    expect(appConfig).toEqual(PRODUCTION_DEFAULTS);
    expect(appConfig).not.toHaveProperty('unknownSection');
  });

  test('ignores unrecognized keys within a known group', () => {
    window.__APP_CONFIG__ = {
      auth0: { domain: 'auth-dev.pamdas.org', unknownKey: 'value' },
    };

    const { default: appConfig } = require('./config');

    expect(appConfig.auth0).not.toHaveProperty('unknownKey');
  });
});
