import { memo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownIcon } from '../../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../../../common/images/icons/arrow-up.svg';

import { DESCENDING_SORT_ORDER, EVENT_LINK_TARGET_TYPES } from '../../../constants';
import { isPatrolSegmentAPause } from '../../../utils/patrols';
import useActivityFeed from '../../../DetailViewComponents/ActivitySection/useActivityFeed';
import useEventLinking from '../../../hooks/useEventLinking';

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
  endIcon,
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
  startIcon,
  startLink = null,
  startTime,
  startTitle,
}) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'activity' });

  const eventLinking = useEventLinking();

  const headingRef = useRef(null);

  // The hook's result is new each render, but its removals keep their identity.
  const removeFromPatrol = eventLinking.removeFromPatrol;

  // A removed card takes its focused button along, so the heading takes focus.
  const onRemoveContainedEvent = useCallback(async (containedEvent) => {
    if (await removeFromPatrol(containedEvent)) {
      headingRef.current?.focus();
    }
  }, [removeFromPatrol]);

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
    endIcon,
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
    // The server removes an event from the whole patrol, even from a leg's activity.
    onRemoveContainedReport: onRemoveContainedEvent,
    removeContainedReportFrom: EVENT_LINK_TARGET_TYPES.PATROL,
    removingContainedReportIds: eventLinking.linkingEventIds,
    sortButtonComponent: CustomSortButton,
    startIcon,
    startLink,
    startTime,
    startTitle,
  });

  return <div className={`${styles.activity} ${className}`}>
    <div className={styles.header}>
      <h2 ref={headingRef} tabIndex={-1}>{t('activitySectionTitle')}</h2>

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

    {/* A pause covered no ground and did nothing but stand still, so the only
        stats it could show are the start and end it already lists below. */}
    {!isPatrolSegmentAPause(patrolSegment)
      && <SummaryStats eventCount={containedEvents.length} patrol={patrol} patrolSegment={patrolSegment} />}

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
