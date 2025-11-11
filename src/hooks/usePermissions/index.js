import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../constants';

const EMPTY_PERMISSION_SET = new Set();

const usePermissions = (permissionKey) => {
  const selectedUserProfile = useSelector((state) => state.data.selectedUserProfile);
  const user = useSelector((state) => state.data.user);

  const permissionsSource = selectedUserProfile?.id ? selectedUserProfile : user;

  const permissionSet = useMemo(() => permissionsSource?.permissions?.[permissionKey]
    ? new Set(permissionsSource.permissions[permissionKey])
    : EMPTY_PERMISSION_SET, [permissionKey, permissionsSource]);

  return useMemo(() => ({
    hasCreatePermission: permissionSet.has(PERMISSIONS.CREATE),
    hasDeletePermission: permissionSet.has(PERMISSIONS.DELETE),
    hasExportPermission: permissionSet.has(PERMISSIONS.EXPORT),
    hasReadPermission: permissionSet.has(PERMISSIONS.READ),
    hasUpdatePermission: permissionSet.has(PERMISSIONS.UPDATE),
  }), [permissionSet]);
};

export const useEventsPermissions = () => {
  // Event permissions are only available if the events feature is enabled.
  const eventsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS]);

  const eventsPermissions = usePermissions(PERMISSION_KEYS.EVENTS);

  return useMemo(() => ({
    hasEventsCreatePermission: eventsEnabled && eventsPermissions.hasCreatePermission,
    hasEventsDeletePermission: eventsEnabled && eventsPermissions.hasDeletePermission,
    hasEventsExportPermission: eventsEnabled && eventsPermissions.hasExportPermission,
    hasEventsReadPermission: eventsEnabled && eventsPermissions.hasReadPermission,
    hasEventsUpdatePermission: eventsEnabled && eventsPermissions.hasUpdatePermission,
  }), [eventsEnabled, eventsPermissions]);
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
  // Patrol permissions are only available if the patrol management feature is
  // enabled.
  const patrolManagementEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]);

  const patrolsPermissions = usePermissions(PERMISSION_KEYS.PATROLS);

  return useMemo(() => ({
    hasPatrolsCreatePermission: patrolManagementEnabled && patrolsPermissions.hasCreatePermission,
    hasPatrolsDeletePermission: patrolManagementEnabled && patrolsPermissions.hasDeletePermission,
    hasPatrolsExportPermission: patrolManagementEnabled && patrolsPermissions.hasExportPermission,
    hasPatrolsReadPermission: patrolManagementEnabled && patrolsPermissions.hasReadPermission,
    hasPatrolsUpdatePermission: patrolManagementEnabled && patrolsPermissions.hasUpdatePermission,
  }), [patrolManagementEnabled, patrolsPermissions]);
};
