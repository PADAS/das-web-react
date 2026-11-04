import { createSelector } from 'reselect';

import { getEventIncidentId, getEventPatrolId, INCIDENT_COLLECTION_EVENT_TYPE } from '../../utils/events';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../../constants';
import { selectEventCategoryPermissions } from '../event-types';

const EMPTY_PERMISSIONS = [];

const INCIDENT_COLLECTION_EVENT = { event_type: INCIDENT_COLLECTION_EVENT_TYPE };

const selectIncidentCategoryPermissions = (state) => selectEventCategoryPermissions(state, INCIDENT_COLLECTION_EVENT);

const selectIsPatrolManagementEnabled = (state) => !!state.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT];

const selectUserPermissions = (state) => (state.data.selectedUserProfile?.id
  ? state.data.selectedUserProfile
  : state.data.user)?.permissions;

// Every link change but leaving an incident edits the event, so it takes the
// right to update its category; the server checks patrol links with it too.
export const selectEventLinkPermissions = createSelector(
  [
    selectEventCategoryPermissions,
    selectIncidentCategoryPermissions,
    selectIsPatrolManagementEnabled,
    selectUserPermissions,
    (_, event) => !!event?.is_collection,
    (_, event) => getEventIncidentId(event),
    (_, event) => getEventPatrolId(event),
  ],
  (
    eventCategoryPermissions,
    incidentCategoryPermissions,
    isPatrolManagementEnabled,
    userPermissions,
    isCollection,
    incidentId,
    patrolId
  ) => {
    const canChangePatrolLinks = isPatrolManagementEnabled
      && (userPermissions?.[PERMISSION_KEYS.PATROLS] ?? EMPTY_PERMISSIONS).includes(PERMISSIONS.READ)
      && eventCategoryPermissions.hasUpdatePermission;

    return {
      canAddToIncident: !isCollection && !incidentId && eventCategoryPermissions.hasUpdatePermission,
      canAddToPatrol: canChangePatrolLinks && !patrolId,
      canCreateIncident: incidentCategoryPermissions.hasCreatePermission,
      canRemoveFromIncident: !!incidentId
        && (userPermissions?.[PERMISSION_KEYS.EVENT_RELATIONSHIPS] ?? EMPTY_PERMISSIONS).includes(PERMISSIONS.DELETE),
      canRemoveFromPatrol: canChangePatrolLinks && !!patrolId,
    };
  }
);
