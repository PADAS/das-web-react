import { createSelector } from 'reselect';

import { getEventIncidentId, getEventPatrolId, INCIDENT_COLLECTION_EVENT_TYPE } from '../../utils/events';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../constants';
import { selectActiveUserPermissions } from '../user';
import { selectEventCategoryPermissions } from '../event-types';

const EMPTY_PERMISSIONS = [];

const INCIDENT_COLLECTION_EVENT = { event_type: INCIDENT_COLLECTION_EVENT_TYPE };

const selectIncidentCategoryPermissions = (state) => selectEventCategoryPermissions(state, INCIDENT_COLLECTION_EVENT);

const selectIsPatrolManagementEnabled = (state) => !!state.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT];

const hasUserPermission = (userPermissions, permissionKey, permission) => (
  userPermissions?.[permissionKey] ?? EMPTY_PERMISSIONS
).includes(permission);

// Joining an incident edits the event, so it takes the right to update its
// category. A patrol link edits the patrol alone, which the server reads first.
export const selectEventLinkPermissions = createSelector(
  [
    selectEventCategoryPermissions,
    selectIncidentCategoryPermissions,
    selectIsPatrolManagementEnabled,
    selectActiveUserPermissions,
    (_, event) => !!event,
    (_, event) => !!event?.is_collection,
    (_, event) => getEventIncidentId(event),
    (_, event) => getEventPatrolId(event),
  ],
  (
    eventCategoryPermissions,
    incidentCategoryPermissions,
    isPatrolManagementEnabled,
    activeUserPermissions,
    hasEvent,
    isCollection,
    incidentId,
    patrolId
  ) => {
    const canChangePatrolLinks = hasEvent
      && isPatrolManagementEnabled
      && hasUserPermission(activeUserPermissions, PERMISSION_KEYS.PATROLS, PERMISSIONS.READ)
      && hasUserPermission(activeUserPermissions, PERMISSION_KEYS.PATROLS, PERMISSIONS.UPDATE);

    return {
      canAddToIncident: !isCollection && !incidentId && eventCategoryPermissions.hasUpdatePermission,
      canAddToPatrol: canChangePatrolLinks && !patrolId,
      canCreateIncident: incidentCategoryPermissions.hasCreatePermission,
      canRemoveFromIncident: !!incidentId
        && hasUserPermission(activeUserPermissions, PERMISSION_KEYS.EVENT_RELATIONSHIPS, PERMISSIONS.DELETE),
      canRemoveFromPatrol: canChangePatrolLinks
        && !!patrolId
        && hasUserPermission(activeUserPermissions, PERMISSION_KEYS.EVENT_RELATED_SEGMENTS, PERMISSIONS.DELETE),
    };
  }
);
