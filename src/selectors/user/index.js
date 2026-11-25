import { createSelector } from 'reselect';

import { userIsGeoPermissionRestricted } from '../../utils/geo-perms';

const EMPTY_PERMISSIONS = {};

const selectSelectedUserProfile = (state) => state.data.selectedUserProfile;

// Stays the signed-in account; permission checks read selectActiveUser.
export const selectSignedInUser = (state) => state.data.user;

export const selectIsSignedInUserLoaded = (state) => !!state.data.user?.id;

export const selectActiveProfileId = (state) => state.data.selectedUserProfile?.id ?? null;

export const selectActiveUser = createSelector(
  [selectSignedInUser, selectSelectedUserProfile],
  (signedInUser, selectedUserProfile) => selectedUserProfile?.id ? selectedUserProfile : signedInUser,
);

export const selectActiveUserPermissions = createSelector(
  [selectActiveUser],
  (activeUser) => activeUser?.permissions ?? EMPTY_PERMISSIONS,
);

export const selectIsGeoPermissionRestricted = createSelector(
  [selectActiveUser],
  userIsGeoPermissionRestricted,
);
