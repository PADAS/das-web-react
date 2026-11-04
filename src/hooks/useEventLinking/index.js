import { useCallback, useContext, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  addEventToIncident,
  addEventToPatrol,
  createEvent,
  removeEventFromIncident,
  removeEventFromPatrol,
} from '../../ducks/events';
import { createNewIncidentCollection, getEventIncidentId, getEventPatrolId } from '../../utils/events';
import { EVENT_LINK_TARGET_TYPES } from '../../constants';
import { showToast } from '../../utils/toast';
import { TrackerContext } from '../../utils/analytics';

const LINK_TOAST_CONFIG = { autoClose: 4000, hideProgressBar: true };

const useEventLinking = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'eventLinking' });

  const tracker = useContext(TrackerContext);

  const createdIncidentRef = useRef(null);
  // Updated at once, unlike the state, so a press before a render is ignored.
  const linkingEventIdsRef = useRef(new Set());
  const saveLinkModalEventRef = useRef(null);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkingEventIds, setLinkingEventIds] = useState(() => new Set());
  const [linkModalEvent, setLinkModalEvent] = useState(null);
  const [linkModalType, setLinkModalType] = useState(null);

  const closeLinkModal = () => setIsLinkModalOpen(false);

  // Resolves to false when the change fails or is already running for the
  // event; a new event that fails to save shows its own errors instead.
  const changeEventLinks = useCallback(async (event, {
    change,
    errorMessage,
    failureTrackingAction,
    successMessage,
    successTrackingAction,
  }) => {
    if (linkingEventIdsRef.current.has(event.id)) {
      return false;
    }

    linkingEventIdsRef.current.add(event.id);
    setLinkingEventIds(new Set(linkingEventIdsRef.current));

    try {
      const savedEvent = event.id ? event : await saveLinkModalEventRef.current?.();
      if (savedEvent) {
        const linkedRecord = await change(savedEvent.id);

        showToast({
          details: '',
          message: successMessage(savedEvent, linkedRecord),
          toastConfig: { ...LINK_TOAST_CONFIG, type: 'success' },
        });

        tracker.track(successTrackingAction);
      }

      return true;
    } catch (error) {
      console.warn('Error changing the links of an event', error);

      showToast({ details: '', message: errorMessage, toastConfig: { ...LINK_TOAST_CONFIG, type: 'error' } });

      tracker.track(failureTrackingAction);

      return false;
    } finally {
      linkingEventIdsRef.current.delete(event.id);
      setLinkingEventIds(new Set(linkingEventIdsRef.current));
    }
  }, [tracker]);

  const addToIncident = (incident) => changeEventLinks(linkModalEvent, {
    change: async (eventId) => {
      await dispatch(addEventToIncident(eventId, incident.id));

      return incident;
    },
    errorMessage: t('addToIncidentErrorMessage'),
    failureTrackingAction: 'Fail to add an event to an existing incident',
    successMessage: (linkedEvent, linkedIncident) => t('addedToIncidentMessage', {
      eventSerialNumber: linkedEvent.serial_number,
      incidentSerialNumber: linkedIncident.serial_number,
    }),
    successTrackingAction: 'Add an event to an existing incident',
  });

  const addToPatrol = (patrol) => changeEventLinks(linkModalEvent, {
    change: async (eventId) => {
      await dispatch(addEventToPatrol(eventId, patrol.id));

      return patrol;
    },
    errorMessage: t('addToPatrolErrorMessage'),
    failureTrackingAction: 'Fail to add an event to a patrol',
    successMessage: (linkedEvent, linkedPatrol) => t('addedToPatrolMessage', {
      eventSerialNumber: linkedEvent.serial_number,
      patrolSerialNumber: linkedPatrol.serial_number,
    }),
    successTrackingAction: 'Add an event to a patrol',
  });

  const addToLinkTarget = async (target) => {
    const isAdded = await (linkModalType === EVENT_LINK_TARGET_TYPES.PATROL
      ? addToPatrol(target)
      : addToIncident(target));
    if (isAdded) {
      closeLinkModal();
    }
  };

  const addToNewIncident = async () => {
    const isAdded = await changeEventLinks(linkModalEvent, {
      change: async (eventId) => {
        // A retry reuses the incident that the event's failed attempt created.
        if (createdIncidentRef.current?.eventId !== eventId) {
          const response = await dispatch(createEvent(createNewIncidentCollection({
            priority: linkModalEvent.priority,
          })));
          createdIncidentRef.current = { eventId, incident: response.data.data };
        }

        const createdIncident = createdIncidentRef.current.incident;
        await dispatch(addEventToIncident(eventId, createdIncident.id));
        createdIncidentRef.current = null;

        return createdIncident;
      },
      errorMessage: t('addToNewIncidentErrorMessage'),
      failureTrackingAction: 'Fail to add an event to a new incident',
      successMessage: (linkedEvent, linkedIncident) => t('addedToNewIncidentMessage', {
        eventSerialNumber: linkedEvent.serial_number,
        incidentSerialNumber: linkedIncident.serial_number,
      }),
      successTrackingAction: 'Add an event to a new incident',
    });
    if (isAdded) {
      closeLinkModal();
    }
  };

  // Only a new event needs saving, and only once a target is picked.
  const openLinkModal = useCallback((type, event, saveEvent = null) => {
    saveLinkModalEventRef.current = saveEvent;

    setLinkModalEvent(event);
    setLinkModalType(type);
    setIsLinkModalOpen(true);

    tracker.track(`Open the add to ${type} modal`);
  }, [tracker]);

  const removeFromIncident = useCallback((event, incidentId = getEventIncidentId(event)) => changeEventLinks(event, {
    change: (eventId) => dispatch(removeEventFromIncident(eventId, incidentId)),
    errorMessage: t('removeFromIncidentErrorMessage'),
    failureTrackingAction: 'Fail to remove an event from an incident',
    successMessage: (unlinkedEvent, unlinkedIncident) => unlinkedIncident
      ? t('removedFromIncidentMessage', {
        eventSerialNumber: unlinkedEvent.serial_number,
        incidentSerialNumber: unlinkedIncident.serial_number,
      })
      : t('removedFromUnloadedIncidentMessage', { eventSerialNumber: unlinkedEvent.serial_number }),
    successTrackingAction: 'Remove an event from an incident',
  }), [changeEventLinks, dispatch, t]);

  const removeFromPatrol = useCallback((event) => changeEventLinks(event, {
    change: (eventId) => dispatch(removeEventFromPatrol(eventId, getEventPatrolId(event))),
    errorMessage: t('removeFromPatrolErrorMessage'),
    failureTrackingAction: 'Fail to remove an event from a patrol',
    successMessage: (unlinkedEvent, unlinkedPatrol) => unlinkedPatrol
      ? t('removedFromPatrolMessage', {
        eventSerialNumber: unlinkedEvent.serial_number,
        patrolSerialNumber: unlinkedPatrol.serial_number,
      })
      : t('removedFromUnloadedPatrolMessage', { eventSerialNumber: unlinkedEvent.serial_number }),
    successTrackingAction: 'Remove an event from a patrol',
  }), [changeEventLinks, dispatch, t]);

  return {
    addToLinkTarget,
    addToNewIncident,
    closeLinkModal,
    isLinkModalOpen,
    // A new event changes its links under no id until it is saved.
    isLinking: linkingEventIds.has(linkModalEvent?.id),
    linkingEventIds,
    linkModalEvent,
    linkModalType,
    openLinkModal,
    removeFromIncident,
    removeFromPatrol,
  };
};

export default useEventLinking;
