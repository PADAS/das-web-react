import { hasOAuthCallbackParams } from './oauth';

describe('oauth utils', () => {
  describe('hasOAuthCallbackParams', () => {
    test('returns true when code parameter is present', () => {
      expect(hasOAuthCallbackParams('?code=abc123')).toBe(true);
    });

    test('returns true when state parameter is present', () => {
      expect(hasOAuthCallbackParams('?state=xyz789')).toBe(true);
    });

    test('returns true when error parameter is present', () => {
      expect(hasOAuthCallbackParams('?error=access_denied')).toBe(true);
    });

    test('returns true when multiple OAuth params are present', () => {
      expect(hasOAuthCallbackParams('?code=abc123&state=xyz789')).toBe(true);
    });

    test('returns false when no OAuth params are present', () => {
      expect(hasOAuthCallbackParams('')).toBe(false);
      expect(hasOAuthCallbackParams('?foo=bar')).toBe(false);
      expect(hasOAuthCallbackParams('?lnglat=1,2')).toBe(false);
    });

    test('returns true even when mixed with other params', () => {
      expect(hasOAuthCallbackParams('?foo=bar&code=abc123&baz=qux')).toBe(true);
    });
  });
});
