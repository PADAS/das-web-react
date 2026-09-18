import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownIcon } from '../../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../../../common/images/icons/arrow-up.svg';

import { DESCENDING_SORT_ORDER } from '../../../constants';
import useActivityFeed from '../../../DetailViewComponents/ActivitySection/useActivityFeed';

import SummaryStats from './SummaryStats';

import * as styles from './styles.module.scss';

const CustomSortButton = ({ disabled, sortOrder, testId, toggleSortFn }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'activity' });

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
  attachments,
  className = '',
  containedEvents,
  emptyStateMessage,
  endTime,
  endTitle,
  existingNotes = [],
  milestones,
  newAttachments,
  newNotes,
  onCancelNote,
  onChangeNote,
  onDeleteAttachment,
  onDeleteNote,
  onDoneNote,
  patrol,
  patrolSegment = null,
  startTime,
  startTitle,
}) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'activity' });

  const {
    areAllItemsExpanded,
    hasCollapsibleItems,
    hasItems,
    onToggleExpandAll,
    sortButton,
    sortedItems,
  } = useActivityFeed({
    attachments,
    containedReports: containedEvents,
    endTime,
    endTitle,
    milestones,
    newAttachments,
    newNotes,
    notes: existingNotes,
    onCancelNote,
    onChangeNote,
    onDeleteAttachment,
    onDeleteNote,
    onDoneNote,
    sortButtonComponent: CustomSortButton,
    startTime,
    startTitle,
  });

  return <div className={`${styles.activity} ${className}`}>
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

    <SummaryStats eventCount={containedEvents.length} patrol={patrol} patrolSegment={patrolSegment} />

    {hasItems
      ? <ul className={styles.activityList}>
        {sortedItems}
      </ul>
      : <div className={styles.emptyState}>
        <p className={styles.emptyStateMessage}>{emptyStateMessage}</p>
      </div>}
  </div>;
};

export default memo(Activity);
