import { userIsGeoPermissionRestricted } from './geo-perms';

describe('Utils - geo-perms', () => {
  describe('userIsGeoPermissionRestricted', () => {
    test('validates a user with a permission postfixed with _geographic_distance', () => {
      const user = {
        permissions: {
          view_security_events_geographic_distance: true,
        },
      };

      expect(userIsGeoPermissionRestricted(user)).toBe(true);
    });

    test('validates a user with a permission postfixed with _gd', () => {
      const user = {
        permissions: {
          view_security_events_gd: true,
        },
      };

      expect(userIsGeoPermissionRestricted(user)).toBe(true);
    });

    test('validates a user with a no geopermissions', () => {
      const user = {
        permissions: {
          view_security_events: true,
        },
      };

      expect(userIsGeoPermissionRestricted(user)).toBe(false);
    });

    test('validates a user with a no permissions at all', () => {
      const user = {};

      expect(userIsGeoPermissionRestricted(user)).toBe(false);
    });
  });
});