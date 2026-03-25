import { getIsValidWebUrl, hashCode, hashString } from './string';

describe('String utils', () => {
  describe('getIsValidWebUrl', () => {
    test('returns true for a valid web url', () => {
      expect(getIsValidWebUrl('https://www.earthranger.com')).toBe(true);
      expect(getIsValidWebUrl('http://earthranger.com')).toBe(true);
    });

    test('returns false for an invalid web url', () => {
      expect(getIsValidWebUrl('ftp://www.google.com')).toBe(false);
      expect(getIsValidWebUrl('mailto:test@example.com')).toBe(false);
      expect(getIsValidWebUrl('invalid-url')).toBe(false);
    });
  });

  describe('hashCode', () => {
    test('hashes an empty string', () => {
      expect(hashCode('')).toBe(0);
    });

    test('hashes a valid string', () => {
      expect(hashCode('word')).toBe(3655434);
      expect(hashCode('hello world')).toBe(1794106052);
      expect(hashCode('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.')).toBe(512895612);
    });
  });

  describe('hashString', () => {
    test('returns "unknown" for falsy values', () => {
      expect(hashString(null)).toBe('unknown');
      expect(hashString(undefined)).toBe('unknown');
      expect(hashString('')).toBe('unknown');
      expect(hashString(0)).toBe('unknown');
      expect(hashString(false)).toBe('unknown');
    });

    test('returns consistent hash for same string', () => {
      const hash1 = hashString('test-user-123');
      const hash2 = hashString('test-user-123');
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe('unknown');
      expect(typeof hash1).toBe('string');
    });

    test('returns different hashes for different strings', () => {
      const hash1 = hashString('user-123');
      const hash2 = hashString('user-456');
      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe('unknown');
      expect(hash2).not.toBe('unknown');
    });
  });
});
