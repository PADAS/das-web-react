import { useContext, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { addEventToIncident, addEventToPatrol, createEvent } from '../../ducks/events';
import {
  createNewIncidentCollection,
  eventBelongsToCollection,
  eventBelongsToPatrol,
  INCIDENT_COLLECTION_EVENT_TYPE,
} from '../../utils/events';
import { EVENT_LINK_TARGET_TYPES, SYSTEM_CONFIG_FLAGS } from '../../constants';
import { selectEventCategoryPermissions } from '../../selectors/event-types';
import { showToast } from '../../utils/toast';
import { TrackerContext } from '../../utils/analytics';
import { useEventRelationshipsPermissions, usePatrolsPermissions } from '../usePermissions';

const INCIDENT_COLLECTION_EVENT = { event_type: INCIDENT_COLLECTION_EVENT_TYPE };

const LINK_TOAST_CONFIG = { autoClose: 4000, hideProgressBar: true };

const useEventLinking = (event, { saveEvent = null } = {}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'eventLinking' });

  const eventRelationshipsPermissions = useEventRelationshipsPermissions();
  const patrolsPermissions = usePatrolsPermissions();

  const eventCategoryPermissions = useSelector((state) => selectEventCategoryPermissions(state, event));
  const incidentCategoryPermissions = useSelector(
    (state) => selectEventCategoryPermissions(state, INCIDENT_COLLECTION_EVENT)
  );
  const isPatrolManagementEnabled = useSelector(
    (state) => !!state.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]
  );

  const tracker = useContext(TrackerContext);

  const createdIncidentRef = useRef(null);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkModalType, setLinkModalType] = useState(null);

  const belongsToIncident = eventBelongsToCollection(event);
  // Linking changes the event, so it takes the right to edit its category.
  const permissions = {
    canAddToIncident: !event.is_collection && !belongsToIncident && eventCategoryPermissions.hasUpdatePermission,
    canAddToPatrol: isPatrolManagementEnabled
      && patrolsPermissions.hasPatrolsReadPermission
      && eventCategoryPermissions.hasUpdatePermission
      && !eventBelongsToPatrol(event),
    canCreateIncident: incidentCategoryPermissions.hasCreatePermission,
    canRemoveFromIncident: belongsToIncident && eventRelationshipsPermissions.hasEventRelationshipsDeletePermission,
  };

  const closeLinkModal = () => setIsLinkModalOpen(false);

  // Only a saved event can be linked, and a failed save shows its own errors.
  const linkEvent = async ({ errorMessage, failureTrackingAction, link, successMessage, successTrackingAction }) => {
    setIsLinking(true);

    try {
      const eventToLink = saveEvent ? await saveEvent() : event;
      if (eventToLink) {
        const target = await link(eventToLink.id);

        showToast({
          details: '',
          message: successMessage(eventToLink, target),
          toastConfig: { ...LINK_TOAST_CONFIG, type: 'success' },
        });

        tracker.track(successTrackingAction);
      }

      closeLinkModal();
    } catch (error) {
      console.warn('Error linking an event', error);

      showToast({ details: '', message: errorMessage, toastConfig: { ...LINK_TOAST_CONFIG, type: 'error' } });

      tracker.track(failureTrackingAction);
    } finally {
      setIsLinking(false);
    }
  };

  const addToIncident = (incident) => linkEvent({
    errorMessage: t('addToIncidentErrorMessage'),
    failureTrackingAction: 'Fail to add an event to an existing incident',
    link: async (eventId) => {
      await dispatch(addEventToIncident(eventId, incident.id));

      return incident;
    },
    successMessage: (linkedEvent, linkedIncident) => t('addedToIncidentMessage', {
      eventSerialNumber: linkedEvent.serial_number,
      incidentSerialNumber: linkedIncident.serial_number,
    }),
    successTrackingAction: 'Add an event to an existing incident',
  });

  const addToNewIncident = () => linkEvent({
    errorMessage: t('addToNewIncidentErrorMessage'),
    failureTrackingAction: 'Fail to add an event to a new incident',
    link: async (eventId) => {
      // A retry reuses the incident that the failed attempt created.
      if (!createdIncidentRef.current) {
        const response = await dispatch(createEvent(createNewIncidentCollection({ priority: event.priority })));
        createdIncidentRef.current = response.data.data;
      }

      await dispatch(addEventToIncident(eventId, createdIncidentRef.current.id));

      return createdIncidentRef.current;
    },
    successMessage: (linkedEvent, linkedIncident) => t('addedToNewIncidentMessage', {
      eventSerialNumber: linkedEvent.serial_number,
      incidentSerialNumber: linkedIncident.serial_number,
    }),
    successTrackingAction: 'Add an event to a new incident',
  });

  const addToPatrol = (patrol) => linkEvent({
    errorMessage: t('addToPatrolErrorMessage'),
    failureTrackingAction: 'Fail to add an event to a patrol',
    link: async (eventId) => {
      await dispatch(addEventToPatrol(eventId, patrol.id));

      return patrol;
    },
    successMessage: (linkedEvent, linkedPatrol) => t('addedToPatrolMessage', {
      eventSerialNumber: linkedEvent.serial_number,
      patrolSerialNumber: linkedPatrol.serial_number,
    }),
    successTrackingAction: 'Add an event to a patrol',
  });

  const addToLinkTarget = (target) => linkModalType === EVENT_LINK_TARGET_TYPES.PATROL
    ? addToPatrol(target)
    : addToIncident(target);

  const openLinkModal = (type) => {
    setLinkModalType(type);
    setIsLinkModalOpen(true);

    tracker.track(`Open the add to ${type} modal`);
  };

  return {
    addToLinkTarget,
    addToNewIncident,
    closeLinkModal,
    isLinkModalOpen,
    isLinking,
    linkModalType,
    openLinkModal,
    permissions,
  };
};

export default useEventLinking;
