import {
  selectActiveProfileId,
  selectActiveUser,
  selectActiveUserPermissions,
  selectIsGeoPermissionRestricted,
  selectIsSignedInUserLoaded,
  selectSignedInUser,
} from './';

describe('selectors - user', () => {
  let profile, user;
  beforeEach(() => {
    profile = { id: 'profile', permissions: { event: ['view'] }, username: 'profile' };
    user = { id: 'user', permissions: { event: ['add', 'view'] }, username: 'user' };
  });

  const buildState = ({ selectedUserProfile = {}, signedInUser = user } = {}) => ({
    data: { selectedUserProfile, user: signedInUser },
  });

  describe('selectSignedInUser', () => {
    test('returns the signed-in account while a profile is active', () => {
      expect(selectSignedInUser(buildState({ selectedUserProfile: profile }))).toBe(user);
    });
  });

  describe('selectIsSignedInUserLoaded', () => {
    test('returns true once the signed-in account has an id', () => {
      expect(selectIsSignedInUserLoaded(buildState())).toBe(true);
    });

    test('returns false before the signed-in account loads', () => {
      expect(selectIsSignedInUserLoaded(buildState({ signedInUser: {} }))).toBe(false);
      expect(selectIsSignedInUserLoaded(buildState({ signedInUser: null }))).toBe(false);
    });
  });

  describe('selectActiveProfileId', () => {
    test('returns the id of the active profile', () => {
      expect(selectActiveProfileId(buildState({ selectedUserProfile: profile }))).toBe('profile');
    });

    test('returns null when no profile is active', () => {
      expect(selectActiveProfileId(buildState())).toBeNull();
      expect(selectActiveProfileId(buildState({ selectedUserProfile: null }))).toBeNull();
    });
  });

  describe('selectActiveUser', () => {
    test('returns the profile while one is active', () => {
      expect(selectActiveUser(buildState({ selectedUserProfile: profile }))).toBe(profile);
    });

    test('returns the signed-in account when no profile is active', () => {
      expect(selectActiveUser(buildState())).toBe(user);
      expect(selectActiveUser(buildState({ selectedUserProfile: null }))).toBe(user);
    });
  });

  describe('selectActiveUserPermissions', () => {
    test('returns the permissions of the active profile', () => {
      expect(selectActiveUserPermissions(buildState({ selectedUserProfile: profile }))).toBe(profile.permissions);
    });

    test('returns the permissions of the signed-in account when no profile is active', () => {
      expect(selectActiveUserPermissions(buildState())).toBe(user.permissions);
    });

    test('returns the same empty permissions while the active user has none', () => {
      const firstPermissions = selectActiveUserPermissions(buildState({ signedInUser: {} }));
      const secondPermissions = selectActiveUserPermissions(buildState({ signedInUser: null }));

      expect(firstPermissions).toEqual({});
      expect(secondPermissions).toBe(firstPermissions);
    });
  });

  describe('selectIsGeoPermissionRestricted', () => {
    test('returns true for a geo-restricted profile whose account is not restricted', () => {
      profile.permissions = { view_event_geographic_distance: ['view'] };

      expect(selectIsGeoPermissionRestricted(buildState({ selectedUserProfile: profile }))).toBe(true);
    });

    test('returns false for an unrestricted profile whose account is geo-restricted', () => {
      user.permissions = { view_event_geographic_distance: ['view'] };

      expect(selectIsGeoPermissionRestricted(buildState({ selectedUserProfile: profile }))).toBe(false);
    });

    test('returns false when the active user has not loaded', () => {
      expect(selectIsGeoPermissionRestricted(buildState({ signedInUser: null }))).toBe(false);
    });
  });
});
