import { memo, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { EVENT_FORM_STATES, TAB_KEYS } from '../../../../constants';
import { PRIORITY_COLOR_MAP } from '../../../../utils/events';
import { TrackerContext } from '../../../../utils/analytics';
import useNavigate from '../../../../hooks/useNavigate';
import useReport from '../../../../hooks/useReport';

import Actions from './Actions';
import DateTime from '../../../../DateTime';
import EventIcon from '../../../../EventIcon';
import Link from '../../../../Link';
import TimeAgo from '../../../../TimeAgo';

import * as styles from './styles.module.scss';

// The title link opens the row's menu too; buttons and inputs keep the browser's.
const CONTEXT_MENU_CONTROL_SELECTOR = 'button, input';
const ROW_CONTROL_SELECTOR = 'a, button, input';

// The row's controls act on it in place, and its menus open through portals
// from outside the row.
const isRowItselfTarget = (domEvent, controlSelector) => domEvent.currentTarget.contains(domEvent.target)
  && !domEvent.target.closest(controlSelector);

const STATE_KEY_BY_EVENT_STATE = {
  [EVENT_FORM_STATES.ACTIVE]: EVENT_FORM_STATES.ACTIVE,
  [EVENT_FORM_STATES.NEW_LEGACY]: EVENT_FORM_STATES.ACTIVE,
  [EVENT_FORM_STATES.RESOLVED]: EVENT_FORM_STATES.RESOLVED,
  [EVENT_FORM_STATES.REVIEW]: EVENT_FORM_STATES.REVIEW,
};

const EventRow = ({ displayTimeProp, event }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'eventsManager.eventsFeed.eventRow' });

  const navigate = useNavigate();
  const { coordinates, displayPriority, displayTitle } = useReport(event);

  const tracker = useContext(TrackerContext);

  const contextMenuRef = useRef(null);

  const date = event[displayTimeProp] ?? event.updated_at ?? event.time;

  const eventPath = `/${TAB_KEYS.EVENTS}/${event.id}`;

  const priorityKey = (PRIORITY_COLOR_MAP[displayPriority] ?? PRIORITY_COLOR_MAP[0]).key;

  const stateKey = STATE_KEY_BY_EVENT_STATE[event.state];

  const trackOpenEvent = () => {
    tracker.track(`Open ${event.is_collection ? 'Incident' : 'Event'} Report`, `Event Type:${event.event_type}`);
  };

  const onClickRow = (clickEvent) => {
    if (isRowItselfTarget(clickEvent, ROW_CONTROL_SELECTOR)) {
      navigate(eventPath);

      trackOpenEvent();
    }
  };

  const onContextMenuRow = (contextMenuEvent) => {
    if (isRowItselfTarget(contextMenuEvent, CONTEXT_MENU_CONTROL_SELECTOR)) {
      contextMenuRef.current.open(contextMenuEvent);
    }
  };

  return <li
    className={`${styles.eventRow} ${styles[priorityKey]}`}
    onClick={onClickRow}
    onContextMenu={onContextMenuRow}
  >
    <span aria-hidden="true" className={styles.icon}>
      <EventIcon report={event} />

      {!!event.patrols?.length && <span className={styles.patrolIndicator}>{t('patrolIndicator')}</span>}
    </span>

    <span className={styles.serialNumber}>{event.serial_number}</span>

    <div className={styles.titleRow}>
      <Link className={styles.titleLink} onClick={trackOpenEvent} title={displayTitle} to={eventPath}>
        {displayTitle}
      </Link>
    </div>

    {!!date && <TimeAgo className={styles.details} date={date} prefix={t('agePrefix')} suffix={t('ageSuffix')} />}

    <div className={styles.status}>
      {!!stateKey && <span className={`${styles.statusTitle} ${styles[stateKey]}`}>{t(`states.${stateKey}`)}</span>}

      <DateTime className={styles.statusDate} date={date} showElapsed={false} />
    </div>

    <Actions className={styles.actions} contextMenuRef={contextMenuRef} coordinates={coordinates} event={event} />
  </li>;
};

export default memo(EventRow);
