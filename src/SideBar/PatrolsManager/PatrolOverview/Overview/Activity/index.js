import React from 'react';
import noop from 'lodash/noop';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownIcon } from '../../../../../common/images/icons/arrow-down.svg';
import { ReactComponent as AttachmentIcon } from '../../../../../common/images/icons/attachment.svg';
import { ReactComponent as ExpandArrowIcon } from '../../../../../common/images/icons/expand-arrow.svg';
import { ReactComponent as GpsLocationIcon } from '../../../../../common/images/icons/gps-location-icon.svg';
import { ReactComponent as ImageIcon } from '../../../../../common/images/icons/image.svg';
import { ReactComponent as IncidentIcon } from '../../../../../common/images/icons/incident.svg';
import { ReactComponent as NoteIcon } from '../../../../../common/images/icons/note.svg';
import { ReactComponent as PauseIcon } from '../../../../../common/images/icons/pause.svg';
import { ReactComponent as PlayIcon } from '../../../../../common/images/icons/play.svg';

import * as styles from './styles.module.scss';

const ACTIVITY_FEED_PLACEHOLDER = [
  { icon: <PlayIcon aria-hidden="true" />, id: 'started', text: 'Vehicle Patrol Started', time: '13 April 2026 08:00' },
  { icon: <IncidentIcon aria-hidden="true" />, id: 'event-1', text: '147 Spoor', time: '13 April 2026 08:05' },
  { icon: <IncidentIcon aria-hidden="true" />, id: 'event-2', text: '155 Snare', time: '13 April 2026 08:10' },
  { icon: <NoteIcon aria-hidden="true" />, id: 'note', text: 'Lorem ipsum dolor sit amet, consectetur adip...', time: '13 April 2026 08:11' },
  { icon: <ImageIcon aria-hidden="true" />, id: 'image', text: '3098452035.jpeg', time: '13 April 2026 08:12' },
  { icon: <AttachmentIcon aria-hidden="true" />, id: 'attachment', text: 'patrolcontract.pdf', time: '13 April 2026 08:13' },
  { icon: <PauseIcon aria-hidden="true" />, id: 'paused', text: 'Patrol Paused for 2m', time: '13 April 2026 08:30' },
  { icon: <PlayIcon aria-hidden="true" />, id: 'leg-transition', text: 'Leg 1 Ended, Leg 2 Started', time: '13 April 2026 08:32' },
];

const Activity = () => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.overview.activity' });

  return <div className={styles.activitySection}>
    <div className={styles.sectionHeader}>
      <h2>{t('activitySectionTitle')}</h2>

      <div className={styles.sectionHeaderActions}>
        <button
          aria-label={t('sortButtonLabel')}
          className={styles.sortDirectionButton}
          onClick={noop}
          title={t('sortButtonLabel')}
          type="button"
        >
          <ArrowDownIcon aria-hidden="true" />
        </button>

        <button className={styles.expandAllButton} onClick={noop} type="button">
          {t('expandAllButtonLabel')}
        </button>
      </div>
    </div>

    <div className={styles.statsRow}>
      <div className={styles.statItem}>
        <span className={styles.statLabel}>{t('durationLabel')}</span>

        <span className={styles.statValue}>35min</span>
      </div>

      <div className={styles.statItem}>
        <span className={styles.statLabel}>{t('pausedTimeLabel')}</span>

        <span className={styles.statValue}>2min</span>
      </div>

      <div className={styles.statItem}>
        <span className={styles.statLabel}>{t('activeTimeLabel')}</span>

        <span className={styles.statValue}>33min</span>
      </div>

      <div className={styles.statItem}>
        <span className={styles.statLabel}>{t('distanceLabel')}</span>

        <span className={styles.statValue}>45 km</span>
      </div>

      <div className={styles.statItem}>
        <span className={styles.statLabel}>{t('eventsLabel')}</span>

        <span className={styles.statValue}>2</span>
      </div>
    </div>

    <ul className={styles.feedList} role="list">
      {ACTIVITY_FEED_PLACEHOLDER.map((item) => <li className={styles.feedItem} key={item.id}>
        <span aria-hidden="true" className={styles.feedIcon}>{item.icon}</span>

        <span className={styles.feedText}>{item.text}</span>

        <span className={styles.feedTime}>{item.time}</span>

        <span className={styles.feedActions}>
          <button aria-label={t('jumpToLocationButtonLabel')} className={styles.iconButton} title={t('jumpToLocationButtonLabel')} type="button">
            <GpsLocationIcon aria-hidden="true" />
          </button>

          <button aria-label={t('viewButtonLabel')} className={styles.iconButton} title={t('viewButtonLabel')} type="button">
            <ExpandArrowIcon aria-hidden="true" />
          </button>
        </span>
      </li>)}
    </ul>
  </div>;
};

export default Activity;
