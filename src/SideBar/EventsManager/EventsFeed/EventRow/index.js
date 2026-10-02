import React, { memo, useContext } from 'react';
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

import * as styles from './styles.module.scss';

const ROW_CONTROL_SELECTOR = 'a, button, input';

const STATE_KEY_BY_EVENT_STATE = {
  [EVENT_FORM_STATES.ACTIVE]: EVENT_FORM_STATES.ACTIVE,
  [EVENT_FORM_STATES.NEW_LEGACY]: EVENT_FORM_STATES.ACTIVE,
  [EVENT_FORM_STATES.RESOLVED]: EVENT_FORM_STATES.RESOLVED,
  [EVENT_FORM_STATES.REVIEW]: EVENT_FORM_STATES.REVIEW,
};

const EventRow = ({ displayTimeProp, event }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('reports', { keyPrefix: 'eventsManager.eventsFeed.eventRow' });

  const { coordinates, displayPriority, displaySubtitle, displayTitle } = useReport(event);

  const tracker = useContext(TrackerContext);

  const eventPath = `/${TAB_KEYS.EVENTS}/${event.id}`;

  const priorityKey = (PRIORITY_COLOR_MAP[displayPriority] ?? PRIORITY_COLOR_MAP[0]).key;

  const stateKey = STATE_KEY_BY_EVENT_STATE[event.state];

  const trackOpenEvent = () => {
    tracker.track(`Open ${event.is_collection ? 'Incident' : 'Event'} Report`, `Event Type:${event.event_type}`);
  };

  const onClickRow = (clickEvent) => {
    // The row opens the event, but the controls it carries act on it in place,
    // and its menu opens through a portal from outside the row.
    const isRowItself = clickEvent.currentTarget.contains(clickEvent.target)
      && !clickEvent.target.closest(ROW_CONTROL_SELECTOR);

    if (isRowItself) {
      navigate(eventPath);

      trackOpenEvent();
    }
  };

  return <li className={`${styles.eventRow} ${styles[priorityKey]}`} onClick={onClickRow}>
    <span aria-hidden="true" className={styles.icon}>
      <EventIcon report={event} />

      {!!event.patrols?.length && <span className={styles.patrolIndicator}>{t('patrolIndicator')}</span>}
    </span>

    <span className={styles.serialNumber}>{event.serial_number}</span>

    <div className={`${styles.titleRow} ${displaySubtitle ? '' : styles.onlyLine}`}>
      <Link className={styles.titleLink} onClick={trackOpenEvent} title={displayTitle} to={eventPath}>
        {displayTitle}
      </Link>
    </div>

    {!!displaySubtitle && <p className={styles.details}>{displaySubtitle}</p>}

    <div className={styles.status}>
      {!!stateKey && <span className={`${styles.statusTitle} ${styles[stateKey]}`}>{t(`states.${stateKey}`)}</span>}

      <DateTime
        className={styles.statusDate}
        date={event[displayTimeProp] ?? event.updated_at ?? event.time}
        showElapsed={false}
      />
    </div>

    <Actions className={styles.actions} coordinates={coordinates} event={event} />
  </li>;
};

export default memo(EventRow);
