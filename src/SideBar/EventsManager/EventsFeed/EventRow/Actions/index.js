import React, { memo, useContext, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClipIcon } from '../../../../../common/images/icons/link.svg';
import { ReactComponent as MarkerFeedIcon } from '../../../../../common/images/icons/marker-feed.svg';

import {
  collectionHasMultipleValidLocations,
  getEventIdsForCollection,
  getReportLink,
  isReportActive,
} from '../../../../../utils/events';
import { EVENT_FORM_STATES, PREVIEW_FEATURES } from '../../../../../constants';
import { setBounceEventIDs } from '../../../../../ducks/map-ui';
import { setEventState, updateEvent } from '../../../../../ducks/events';
import { showToast } from '../../../../../utils/toast';
import { TrackerContext } from '../../../../../utils/analytics';
import useJumpToLocation from '../../../../../hooks/useJumpToLocation';
import { usePreviewFeature } from '../../../../../hooks';

import KebabMenu from '../../../../../KebabMenu';
import NotificationDetails from './NotificationDetails';

import * as styles from './styles.module.scss';

const BOUNCE_DELAY = 100;

const COPY_LINK_TOAST_AUTOCLOSE = 2000;

const STATE_TOAST_CONFIG = { autoClose: 4000, hideProgressBar: true };

const { ACTIVE, RESOLVED, REVIEW } = EVENT_FORM_STATES;

const Actions = ({ className = '', coordinates, event }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'eventsManager.eventsFeed.eventRow.actions' });

  // Remove this flag and the conditional option below once community input is
  // enabled for all tenants.
  const isCommunityInputEnabled = usePreviewFeature(PREVIEW_FEATURES.COMMUNITY_INPUT_ADMIN);
  const jumpToLocation = useJumpToLocation();

  const tracker = useContext(TrackerContext);

  const hasJumpedToLocationRef = useRef(false);

  const [isUpdatingState, setIsUpdatingState] = useState(false);

  const hasLocation = !!coordinates?.length;
  const hasMultipleLocations = collectionHasMultipleValidLocations(event);
  const isActive = isReportActive(event);
  const isInReview = event.state === REVIEW;

  // A collection moves its contained events one by one, so each can fail alone.
  const updateContainedEventsState = async (newState) => {
    const containedEvents = [];

    for (const containedEvent of event.contains ?? []) {
      try {
        await dispatch(setEventState(containedEvent.related_event.id, newState));

        containedEvents.push({ ...containedEvent.related_event, isProcessed: true });
      } catch {
        containedEvents.push({ ...containedEvent.related_event, isProcessed: false });
      }
    }

    return containedEvents;
  };

  const onCopyLink = async () => {
    try {
      await window.navigator.clipboard.writeText(getReportLink(event));

      toast.info(t('copyLinkMessage'), { autoClose: COPY_LINK_TOAST_AUTOCLOSE, hideProgressBar: true });

      tracker.track('Copy event link from the events feed');
    } catch (error) {
      console.warn('Error copying event link to clipboard: ', error);
    }
  };

  const onJumpToLocation = () => {
    jumpToLocation(coordinates);

    // A repeated jump bounces the event, so it can be told apart on the map.
    if (hasJumpedToLocationRef.current) {
      dispatch(setBounceEventIDs([]));

      const bounceEventIds = event.is_collection ? getEventIdsForCollection(event) : [event.id];
      setTimeout(() => dispatch(setBounceEventIDs(bounceEventIds)), BOUNCE_DELAY);
    }

    hasJumpedToLocationRef.current = true;

    tracker.track('Click "jump to location" from the events feed', `Event Type:${event.event_type}`);
  };

  const onSelectState = async (newState) => {
    setIsUpdatingState(true);

    try {
      await dispatch(updateEvent({ id: event.id, state: newState }));

      const newStateKey = newState === ACTIVE ? 'activated' : newState;

      if (event.is_collection) {
        const containedEvents = await updateContainedEventsState(newState);

        showToast({
          details: <NotificationDetails
            failedEvents={containedEvents.filter((containedEvent) => !containedEvent.isProcessed)}
            newState={newState}
            processedEvents={containedEvents.filter((containedEvent) => containedEvent.isProcessed)}
          />,
          message: t('updatedCollectionToast.message', {
            collectionSerialNumber: event.serial_number,
            newState: t(`updatedCollectionToast.${newStateKey}`),
          }),
          showDetailsByDefault: true,
          toastConfig: { ...STATE_TOAST_CONFIG, type: 'info' },
        });
      } else {
        showToast({
          details: '',
          message: t('updatedEventToastMessage', {
            eventSerialNumber: event.serial_number,
            newState: t(`states.${newState}`),
          }),
          toastConfig: { ...STATE_TOAST_CONFIG, type: 'info' },
        });
      }

      tracker.track(`Pick the "${newState}" event state from the events feed`);
    } catch (error) {
      showToast({
        details: '',
        message: t('stateUpdateErrorToastMessage', {
          serialNumber: event.serial_number,
          state: t(`states.${isActive ? ACTIVE : event.state}`),
        }),
        toastConfig: { ...STATE_TOAST_CONFIG, type: 'error' },
      });

      console.warn('Error updating an event state from the events feed: ', error);
    } finally {
      setIsUpdatingState(false);
    }
  };

  return <div className={className}>
    <div className={styles.desktopActions}>
      <button
        aria-label={t('jumpToLocationButtonLabel')}
        className={styles.iconButton}
        disabled={!hasLocation}
        onClick={onJumpToLocation}
        title={t('jumpToLocationButtonLabel')}
        type="button"
      >
        {hasMultipleLocations
          ? <span aria-hidden="true" className={styles.multiLocationIcon}>
            <MarkerFeedIcon />

            <MarkerFeedIcon />
          </span>
          : <MarkerFeedIcon aria-hidden="true" />}
      </button>
    </div>

    <KebabMenu
      align="end"
      aria-label={t('moreOptionsButtonLabel')}
      isLoading={isUpdatingState}
      title={t('moreOptionsButtonLabel')}
    >
      {(isActive || isInReview) && <KebabMenu.Option onClick={() => onSelectState(RESOLVED)}>
        {t('stateTransitions.resolve')}
      </KebabMenu.Option>}

      {isActive && isCommunityInputEnabled && <KebabMenu.Option onClick={() => onSelectState(REVIEW)}>
        {t('stateTransitions.review')}
      </KebabMenu.Option>}

      {isInReview && <KebabMenu.Option onClick={() => onSelectState(ACTIVE)}>
        {t('stateTransitions.activate')}
      </KebabMenu.Option>}

      {!isActive && !isInReview && <KebabMenu.Option onClick={() => onSelectState(ACTIVE)}>
        {t('stateTransitions.reopen')}
      </KebabMenu.Option>}

      <KebabMenu.Divider />

      <KebabMenu.Option className={styles.mobileOnlyOption} disabled={!hasLocation} onClick={onJumpToLocation}>
        <MarkerFeedIcon aria-hidden="true" />

        {t('jumpToLocationButtonLabel')}
      </KebabMenu.Option>

      <KebabMenu.Divider className={styles.mobileOnlyOption} />

      <KebabMenu.Option onClick={onCopyLink}>
        <ClipIcon aria-hidden="true" />

        {t('copyLinkOption')}
      </KebabMenu.Option>
    </KebabMenu>
  </div>;
};

export default memo(Actions);
