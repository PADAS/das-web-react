import { hasAuth0CallbackParams } from './auth0';

describe('auth0 utils', () => {
  describe('hasAuth0CallbackParams', () => {
    test('returns true when code and state are present', () => {
      expect(hasAuth0CallbackParams('?code=abc123&state=xyz789')).toBe(true);
    });

    test('returns true when code and error are present', () => {
      expect(hasAuth0CallbackParams('?code=abc123&error=access_denied')).toBe(true);
    });

    test('returns true when code, state, and error are present', () => {
      expect(
        hasAuth0CallbackParams('?code=abc123&state=xyz789&error=access_denied')
      ).toBe(true);
    });

    test('returns false when only code is present', () => {
      expect(hasAuth0CallbackParams('?code=abc123')).toBe(false);
    });

    test('returns false when only state is present', () => {
      expect(hasAuth0CallbackParams('?state=xyz789')).toBe(false);
    });

    test('returns false when only error is present', () => {
      expect(hasAuth0CallbackParams('?error=access_denied')).toBe(false);
    });

    test('returns false when no auth0 params are present', () => {
      expect(hasAuth0CallbackParams('')).toBe(false);
      expect(hasAuth0CallbackParams('?foo=bar')).toBe(false);
      expect(hasAuth0CallbackParams('?lnglat=1,2')).toBe(false);
    });

    test('returns true even when mixed with other params', () => {
      expect(
        hasAuth0CallbackParams('?foo=bar&code=abc123&baz=qux&state=xyz789')
      ).toBe(true);
      expect(
        hasAuth0CallbackParams('?foo=bar&error=access_denied&baz=qux&code=abc123')
      ).toBe(true);
    });

    test('returns false when mixed params lack state/error with code', () => {
      expect(hasAuth0CallbackParams('?foo=bar&code=abc123&baz=qux')).toBe(false);
    });
  });
});
