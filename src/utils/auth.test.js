import {
  isSystemConfigLoaded,
  isValidTokenFormat,
  getIntendedPostAuth0SuccessRoute,
  setIntendedPostAuth0SuccessRoute,
  clearIntendedPostAuth0SuccessRoute,
  setResolvedIssuer,
  getResolvedIssuer,
  clearResolvedIssuer,
  stripAuth0Params,
  getAuthTokenFromCookies,
  getTemporaryAccessTokenFromCookies,
  deleteCookie,
  deleteAuthTokenCookie,
  deleteTemporaryAccessTokenCookie,
} from './auth';

describe('auth utils', () => {
  describe('isSystemConfigLoaded', () => {
    test('returns false when require_idp is null (not loaded)', () => {
      expect(isSystemConfigLoaded({ require_idp: null, sitename: '' })).toBe(false);
    });

    test('returns true when require_idp is false (loaded)', () => {
      expect(isSystemConfigLoaded({ require_idp: false, sitename: 'Test Site' })).toBe(true);
    });

    test('returns true when require_idp is true (loaded)', () => {
      expect(isSystemConfigLoaded({ require_idp: true, sitename: 'Test Site' })).toBe(true);
    });
  });

  describe('isValidTokenFormat', () => {
    test('returns true for valid JWT-like tokens', () => {
      expect(isValidTokenFormat('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U')).toBe(true);
    });

    test('returns true for tokens with dots, dashes, underscores', () => {
      expect(isValidTokenFormat('abc123.def456.ghi789')).toBe(true);
      expect(isValidTokenFormat('token-with-dashes')).toBe(true);
      expect(isValidTokenFormat('token_with_underscores')).toBe(true);
    });

    test('returns false for tokens with invalid characters', () => {
      expect(isValidTokenFormat('token with spaces')).toBe(false);
      expect(isValidTokenFormat('token@invalid')).toBe(false);
      expect(isValidTokenFormat('token#invalid')).toBe(false);
      expect(isValidTokenFormat('token$invalid')).toBe(false);
    });

    test('returns false for empty string', () => {
      expect(isValidTokenFormat('')).toBe(false);
    });

    test('returns false for undefined', () => {
      expect(isValidTokenFormat()).toBe(false);
      expect(isValidTokenFormat(undefined)).toBe(false);
    });

  });

  describe('stripAuth0Params', () => {
    test('removes code parameter', () => {
      expect(stripAuth0Params('/dashboard?code=abc123')).toBe('/dashboard');
    });

    test('removes state parameter', () => {
      expect(stripAuth0Params('/dashboard?state=xyz789')).toBe('/dashboard');
    });

    test('removes error parameter', () => {
      expect(stripAuth0Params('/dashboard?error=access_denied')).toBe('/dashboard');
    });

    test('removes error_description parameter', () => {
      expect(stripAuth0Params('/dashboard?error_description=User%20denied')).toBe('/dashboard');
    });

    test('removes multiple Auth0 params', () => {
      expect(stripAuth0Params('/dashboard?code=abc&state=xyz&error=denied')).toBe('/dashboard');
    });

    test('preserves non-Auth0 params', () => {
      expect(stripAuth0Params('/dashboard?foo=bar&baz=qux')).toBe('/dashboard?foo=bar&baz=qux');
    });

    test('removes Auth0 params while preserving others', () => {
      expect(stripAuth0Params('/dashboard?foo=bar&code=abc&baz=qux')).toBe('/dashboard?foo=bar&baz=qux');
    });

    test('handles URL without query string', () => {
      expect(stripAuth0Params('/dashboard')).toBe('/dashboard');
    });

    test('handles empty query string', () => {
      expect(stripAuth0Params('/dashboard?')).toBe('/dashboard');
    });
  });

  describe('localStorage intended route', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    describe('setIntendedPostAuth0SuccessRoute', () => {
      test('stores route in localStorage', () => {
        setIntendedPostAuth0SuccessRoute('/dashboard');
        expect(localStorage.getItem('er:intended_route')).toBe('/dashboard');
      });

      test('overwrites existing route', () => {
        setIntendedPostAuth0SuccessRoute('/old-route');
        setIntendedPostAuth0SuccessRoute('/new-route');
        expect(localStorage.getItem('er:intended_route')).toBe('/new-route');
      });

      test('handles localStorage errors gracefully', () => {
        const mockSetItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('localStorage unavailable');
        });

        expect(() => setIntendedPostAuth0SuccessRoute('/dashboard')).not.toThrow();
        mockSetItem.mockRestore();
      });
    });

    describe('getIntendedPostAuth0SuccessRoute', () => {
      test('retrieves stored route', () => {
        localStorage.setItem('er:intended_route', '/dashboard');
        expect(getIntendedPostAuth0SuccessRoute()).toBe('/dashboard');
      });

      test('returns null when no route stored', () => {
        expect(getIntendedPostAuth0SuccessRoute()).toBeNull();
      });

      test('handles localStorage errors gracefully', () => {
        const mockGetItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error('localStorage unavailable');
        });

        expect(getIntendedPostAuth0SuccessRoute()).toBeNull();
        mockGetItem.mockRestore();
      });
    });

    describe('clearIntendedPostAuth0SuccessRoute', () => {
      test('removes stored route', () => {
        localStorage.setItem('er:intended_route', '/dashboard');
        clearIntendedPostAuth0SuccessRoute();
        expect(localStorage.getItem('er:intended_route')).toBeNull();
      });

      test('handles clearing non-existent route', () => {
        expect(() => clearIntendedPostAuth0SuccessRoute()).not.toThrow();
      });

      test('handles localStorage errors gracefully', () => {
        const mockRemoveItem = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
          throw new Error('localStorage unavailable');
        });

        expect(() => clearIntendedPostAuth0SuccessRoute()).not.toThrow();
        mockRemoveItem.mockRestore();
      });
    });
  });

  describe('sessionStorage resolved issuer', () => {
    beforeEach(() => sessionStorage.clear());
    afterEach(() => sessionStorage.clear());

    test('round-trips the issuer across a redirect', () => {
      setResolvedIssuer('https://auth.example.org/');

      expect(getResolvedIssuer()).toBe('https://auth.example.org/');
    });

    test('returns null when nothing was stashed', () => {
      expect(getResolvedIssuer()).toBeNull();
    });

    test('clears the stash', () => {
      setResolvedIssuer('https://auth.example.org/');
      clearResolvedIssuer();

      expect(getResolvedIssuer()).toBeNull();
    });

    // sessionStorage rather than localStorage: one tab, one login attempt.
    test('does not write to localStorage', () => {
      setResolvedIssuer('https://auth.example.org/');

      expect(localStorage.getItem('er:resolved_issuer')).toBeNull();
    });

    test('survives storage being unavailable', () => {
      const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('storage unavailable');
      });

      expect(() => setResolvedIssuer('https://auth.example.org/')).not.toThrow();
      setItem.mockRestore();
    });
  });

  describe('cookie utilities', () => {
    beforeEach(() => {
      document.cookie = '';
    });

    afterEach(() => {
      document.cookie = 'token=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'temporaryAccessToken=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    });

    describe('getAuthTokenFromCookies', () => {
      test('retrieves token from cookies', () => {
        document.cookie = 'token=abc123;path=/';
        expect(getAuthTokenFromCookies()).toBe('abc123');
      });

      test('returns null when token not present', () => {
        expect(getAuthTokenFromCookies()).toBeNull();
      });

      test('handles multiple cookies', () => {
        document.cookie = 'other=value;path=/';
        document.cookie = 'token=abc123;path=/';
        expect(getAuthTokenFromCookies()).toBe('abc123');
      });
    });

    describe('getTemporaryAccessTokenFromCookies', () => {
      test('retrieves temporary token from cookies', () => {
        document.cookie = 'temporaryAccessToken=temp123;path=/';
        expect(getTemporaryAccessTokenFromCookies()).toBe('temp123');
      });

      test('returns null when temporary token not present', () => {
        expect(getTemporaryAccessTokenFromCookies()).toBeNull();
      });

      test('handles multiple cookies', () => {
        document.cookie = 'other=value;path=/';
        document.cookie = 'temporaryAccessToken=temp123;path=/';
        expect(getTemporaryAccessTokenFromCookies()).toBe('temp123');
      });
    });

    describe('deleteCookie', () => {
      test('deletes specified cookie', () => {
        document.cookie = 'testCookie=value;path=/';
        deleteCookie('testCookie');
        expect(document.cookie).not.toContain('testCookie');
      });
    });

    describe('deleteAuthTokenCookie', () => {
      test('deletes auth token cookie', () => {
        document.cookie = 'token=abc123;path=/';
        deleteAuthTokenCookie();
        expect(document.cookie).not.toContain('token=');
      });
    });

    describe('deleteTemporaryAccessTokenCookie', () => {
      test('deletes temporary access token cookie', () => {
        document.cookie = 'temporaryAccessToken=temp123;path=/';
        deleteTemporaryAccessTokenCookie();
        expect(document.cookie).not.toContain('temporaryAccessToken=');
      });
    });
  });
});
