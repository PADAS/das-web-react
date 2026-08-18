import React from 'react';
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';

import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';

import useActivityFeed from './useActivityFeed';

import * as styles from './styles.module.scss';

const ActivitySection = ({
  attachments,
  attachmentsToAdd,
  containedReports,
  endTime = null,
  isCommunity = false,
  notes,
  notesToAdd,
  onDeleteAttachment,
  onCancelNote,
  onDeleteNote,
  onChangeNote,
  onDoneNote,
  ref,
  startTime = null,
}) => {
  const { t } = useTranslation('details-view', { keyPrefix: 'activitySection' });

  const { areAllItemsExpanded, hasItems, onToggleExpandAll, sortButton, sortedItems } = useActivityFeed({
    attachments,
    containedReports,
    endTime,
    newAttachments: attachmentsToAdd,
    newNotes: notesToAdd,
    notes,
    onCancelNote,
    onChangeNote,
    onDeleteAttachment,
    onDeleteNote,
    onDoneNote,
    startTime,
  });

  return <div data-testid="detailView-activitySection" ref={ref}>
    {!isCommunity && <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <BulletListIcon />

        <h2>{t('sectionTitle')}</h2>
      </div>

      {hasItems && <div className={styles.actions}>
        <label>{t('timeLabel')}</label>

        {sortButton}

        <Button
          className={styles.expandCollapseButton}
          data-testid="detailView-activitySection-expandCollapseButton"
          onClick={onToggleExpandAll}
          type="button"
          variant="secondary"
        >
          {t(areAllItemsExpanded ? 'collapseAllButton' : 'expandAllButton')}
        </Button>
      </div>}
    </div>}

    {hasItems && <ul className={styles.list}>
      {sortedItems}
    </ul>}
  </div>;
};

export default ActivitySection;
