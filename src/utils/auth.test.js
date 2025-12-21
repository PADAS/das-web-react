import { isSystemConfigLoaded } from './auth';

describe('auth utils', () => {
  describe('isSystemConfigLoaded', () => {
    test('returns false when require_idp is null (not loaded)', () => {
      const systemConfig = { require_idp: null, sitename: '' };
      expect(isSystemConfigLoaded(systemConfig)).toBe(false);
    });

    test('returns true when require_idp is false (loaded)', () => {
      const systemConfig = { require_idp: false, sitename: 'Test Site' };
      expect(isSystemConfigLoaded(systemConfig)).toBe(true);
    });

    test('returns true when require_idp is true (loaded)', () => {
      const systemConfig = { require_idp: true, sitename: 'Test Site', idp_org_id: 'org_123' };
      expect(isSystemConfigLoaded(systemConfig)).toBe(true);
    });
  });
});
