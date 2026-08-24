import React, { memo, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownIcon } from '../../../../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../../../../../common/images/icons/arrow-up.svg';
import { ReactComponent as PlayIcon } from '../../../../../common/images/icons/play.svg';

import { actualEndTimeForPatrol, actualStartTimeForPatrol, getReportsForPatrol } from '../../../../../utils/patrols';
import { DESCENDING_SORT_ORDER } from '../../../../../constants';
import { getEventIdsForCollection } from '../../../../../utils/events';
import useActivityFeed from '../../../../../DetailViewComponents/ActivitySection/useActivityFeed';

import SummaryStats from './SummaryStats';

import * as styles from './styles.module.scss';

const CustomSortButton = ({ disabled, sortOrder, testId, toggleSortFn }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.overview.activity' });

  return <button
    aria-label={t(`sortDirectionButtonLabel.${sortOrder === DESCENDING_SORT_ORDER ? 'down' : 'up'}`)}
    aria-pressed={sortOrder !== DESCENDING_SORT_ORDER}
    className={`${styles.sortDirectionButton} ${sortOrder !== DESCENDING_SORT_ORDER ? styles.active : ''}`}
    data-testid={testId}
    disabled={disabled}
    onClick={toggleSortFn}
    title={t(`sortDirectionButtonLabel.${sortOrder === DESCENDING_SORT_ORDER ? 'down' : 'up'}`)}
    type="button"
    >
    {sortOrder === DESCENDING_SORT_ORDER
      ? <ArrowDownIcon aria-hidden="true" />
      : <ArrowUpIcon aria-hidden="true" />}
  </button>;
};

const Activity = ({
  existingNotes = [],
  newAttachments,
  newNotes,
  onCancelNote,
  onChangeNote,
  onDeleteAttachment,
  onDeleteNote,
  onDoneNote,
  patrol,
}) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.overview.activity' });

  const attachments = useMemo(() => Array.isArray(patrol.files) ? patrol.files : [], [patrol.files]);

  const containedEvents = useMemo(() => {
    const patrolEvents = getReportsForPatrol(patrol);

    const patrolCollections = patrolEvents.filter((event) => event.is_collection);
    const idsOfEventsInPatrolCollections = patrolCollections.reduce(
      (accumulator, incident) => [...accumulator, ...(getEventIdsForCollection(incident) || [])],
      []
    );

    return patrolEvents.filter((event) => !idsOfEventsInPatrolCollections.includes(event.id));
  }, [patrol]);

  const endTime = useMemo(() => actualEndTimeForPatrol(patrol), [patrol]);

  const startTime = useMemo(() => actualStartTimeForPatrol(patrol), [patrol]);

  const legTransitionMilestones = useMemo(() => patrol.patrol_segments
    .slice(0, -1)
    .flatMap((leg, index) => leg.time_range?.end_time
      ? [{
        date: leg.time_range.end_time,
        id: leg.id,
        title: t('legTransitionTitle', { endedLeg: index + 1, startedLeg: index + 2 }),
      }]
      : []), [patrol.patrol_segments, t]);

  const {
    areAllItemsExpanded,
    hasCollapsibleItems,
    hasItems,
    onToggleExpandAll,
    sortButton,
    sortedItems,
  } = useActivityFeed({
    attachments,
    newAttachments,
    containedReports: containedEvents,
    endTime,
    endTitle: t('patrolEndedTitle'),
    milestones: legTransitionMilestones,
    notes: existingNotes,
    newNotes,
    onCancelNote,
    onChangeNote,
    onDeleteAttachment,
    onDeleteNote,
    onDoneNote,
    sortButtonComponent: CustomSortButton,
    startTime,
    startTitle: t('patrolStartedTitle'),
  });

  return <div className={styles.activity}>
    <div className={styles.header}>
      <h2>{t('activitySectionTitle')}</h2>

      <div className={styles.headerActions}>
        <span className={styles.timeLabel}>{t('timeLabel')}</span>

        {sortButton}

        <button
          className={styles.collapseExpandAllButton}
          disabled={!hasCollapsibleItems}
          onClick={onToggleExpandAll}
          type="button"
        >
          {t(areAllItemsExpanded ? 'collapseAllButtonLabel' : 'expandAllButtonLabel')}
        </button>
      </div>
    </div>

    <SummaryStats eventCount={containedEvents.length} patrol={patrol} />

    {hasItems
      ? <ul className={styles.activityList}>
        {sortedItems}
      </ul>
      : <div className={styles.emptyState}>
        <p className={styles.emptyStateMessage}>{t('emptyStateMessage')}</p>

        {/* TODO: Implement start patrol button. */}
        <Button className={styles.startPatrolButton} onClick={() => {}} type="button">
          <PlayIcon aria-hidden="true" />

          {t('startPatrolButton')}
        </Button>
      </div>}
  </div>;
};

export default memo(Activity);
