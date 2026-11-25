import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { PERMISSION_KEYS, PERMISSIONS } from '../../constants';
import { selectActiveUserPermissions } from '../../selectors/user';

const EMPTY_PERMISSION_SET = new Set();

const usePermissions = (permissionKey) => {
  const activeUserPermissions = useSelector(selectActiveUserPermissions);

  const permissionSet = useMemo(() => activeUserPermissions[permissionKey]
    ? new Set(activeUserPermissions[permissionKey])
    : EMPTY_PERMISSION_SET, [activeUserPermissions, permissionKey]);

  return useMemo(() => ({
    hasCreatePermission: permissionSet.has(PERMISSIONS.CREATE),
    hasDeletePermission: permissionSet.has(PERMISSIONS.DELETE),
    hasExportPermission: permissionSet.has(PERMISSIONS.EXPORT),
    hasReadPermission: permissionSet.has(PERMISSIONS.READ),
    hasUpdatePermission: permissionSet.has(PERMISSIONS.UPDATE),
  }), [permissionSet]);
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
