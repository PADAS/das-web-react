import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../constants';

const EMPTY_PERMISSION_SET = new Set();

const usePermissions = (permissionKey) => {
  const eventsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS]);
  const patrolManagementEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]);
  const selectedUserProfile = useSelector((state) => state.data.selectedUserProfile);
  const user = useSelector((state) => state.data.user);

  // Check if the feature is enabled in the system config flags.
  const isFeatureEnabled = useMemo(() => {
    switch (permissionKey) {
    case PERMISSION_KEYS.EVENTS:
      return eventsEnabled;

    case PERMISSION_KEYS.PATROLS:
      return patrolManagementEnabled;

    default:
      return true;
    }
  }, [permissionKey, eventsEnabled, patrolManagementEnabled]);

  // Get the current user's permission set for the given permission key.
  const permissionSet = useMemo(() => {
    const permissionsSource = selectedUserProfile?.id ? selectedUserProfile : user;

    return permissionsSource?.permissions?.[permissionKey]
      ? new Set(permissionsSource.permissions[permissionKey])
      : EMPTY_PERMISSION_SET;
  }, [permissionKey, selectedUserProfile, user]);

  // Return the permissions. If the feature is not enabled, permissions are
  // always false.
  return useMemo(() => ({
    hasCreatePermission: isFeatureEnabled && permissionSet.has(PERMISSIONS.CREATE),
    hasDeletePermission: isFeatureEnabled && permissionSet.has(PERMISSIONS.DELETE),
    hasExportPermission: isFeatureEnabled && permissionSet.has(PERMISSIONS.EXPORT),
    hasReadPermission: isFeatureEnabled && permissionSet.has(PERMISSIONS.READ),
    hasUpdatePermission: isFeatureEnabled && permissionSet.has(PERMISSIONS.UPDATE),
  }), [isFeatureEnabled, permissionSet]);
};

export const useEventsPermissions = () => {
  const eventsPermissions = usePermissions(PERMISSION_KEYS.EVENTS);

  return useMemo(() => ({
    hasEventsCreatePermission: eventsPermissions.hasCreatePermission,
    hasEventsDeletePermission: eventsPermissions.hasDeletePermission,
    hasEventsExportPermission: eventsPermissions.hasExportPermission,
    hasEventsReadPermission: eventsPermissions.hasReadPermission,
    hasEventsUpdatePermission: eventsPermissions.hasUpdatePermission,
  }), [eventsPermissions]);
};

export const useMessagesPermissions = () => {
  const messagesPermissions = usePermissions(PERMISSION_KEYS.MESSAGES);

  return useMemo(() => ({
    hasMessagesCreatePermission: messagesPermissions.hasCreatePermission,
    hasMessagesDeletePermission: messagesPermissions.hasDeletePermission,
    hasMessagesExportPermission: messagesPermissions.hasExportPermission,
    hasMessagesReadPermission: messagesPermissions.hasReadPermission,
    hasMessagesUpdatePermission: messagesPermissions.hasUpdatePermission,
  }), [messagesPermissions]);
};

export const useObservationsPermissions = () => {
  const observationsPermissions = usePermissions(PERMISSION_KEYS.OBSERVATIONS);

  return useMemo(() => ({
    hasObservationsCreatePermission: observationsPermissions.hasCreatePermission,
    hasObservationsDeletePermission: observationsPermissions.hasDeletePermission,
    hasObservationsExportPermission: observationsPermissions.hasExportPermission,
    hasObservationsReadPermission: observationsPermissions.hasReadPermission,
    hasObservationsUpdatePermission: observationsPermissions.hasUpdatePermission,
  }), [observationsPermissions]);
};

export const usePatrolsPermissions = () => {
  const patrolsPermissions = usePermissions(PERMISSION_KEYS.PATROLS);

  return useMemo(() => ({
    hasPatrolsCreatePermission: patrolsPermissions.hasCreatePermission,
    hasPatrolsDeletePermission: patrolsPermissions.hasDeletePermission,
    hasPatrolsExportPermission: patrolsPermissions.hasExportPermission,
    hasPatrolsReadPermission: patrolsPermissions.hasReadPermission,
    hasPatrolsUpdatePermission: patrolsPermissions.hasUpdatePermission,
  }), [patrolsPermissions]);
};
