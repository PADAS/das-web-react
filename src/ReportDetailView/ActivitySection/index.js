import React, { memo, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as ArrowDown } from '../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUp } from '../../common/images/icons/arrow-up.svg';
import { ReactComponent as AttachmentIcon } from '../../common/images/icons/attachment.svg';
import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';
import { ReactComponent as TrashCanIcon } from '../../common/images/icons/trash-can.svg';
import { ReactComponent as DownloadArrowIcon } from '../../common/images/icons/download-arrow.svg';

import { ASCENDING_SORT_ORDER, DESCENDING_SORT_ORDER } from '../../constants';
import { downloadFileFromUrl } from '../../utils/download';

import DateTime from '../../DateTime';

import styles from './styles.module.scss';

const ActivitySection = ({ attachmentsToAdd, reportAttachments, reportTracker, setAttachmentsToAdd }) => {
  const [timeSortOrder, setTimeSortOrder] = useState(DESCENDING_SORT_ORDER);

  const reportAttachmentsRendered = useMemo(() => reportAttachments.map((attachment) => {
    const onDownloadAttachment = () => {
      downloadFileFromUrl(attachment.url, { filename: attachment.filename });

      reportTracker.track('Open Report Attachment');
    };

    return {
      date: attachment.updated_at || attachment.created_at,
      node: <li key={attachment.id}>
        <div className={styles.icon}>
          <AttachmentIcon />
        </div>

        <div className={styles.details}>
          <p className={styles.itemTitle}>{attachment.filename}</p>

          <DateTime className={styles.date} date={attachment.updates[0].time} showElapsed={false} />
        </div>

        <div className={styles.itemActionButton}>
          <DownloadArrowIcon
            data-testid="reportDetailView-activitySection-downloadIcon"
            onClick={onDownloadAttachment}
          />
        </div>

        <div className={styles.itemActionButton} />
      </li>,
    };
  }), [reportAttachments, reportTracker]);

  const attachmentsToAddRendered = useMemo(() => attachmentsToAdd.map((attachment) => {
    const onDeleteAttachment = () => setAttachmentsToAdd(
      attachmentsToAdd.filter((attachmentToAdd) => attachmentToAdd.name !== attachment.name)
    );

    return {
      date: new Date().toISOString(),
      node: <li key={attachment.name}>
        <div className={styles.icon}>
          <AttachmentIcon />
        </div>

        <div className={styles.details}>
          <p className={styles.itemTitle}>{attachment.name}</p>
        </div>

        <div className={styles.itemActionButton}>
          <TrashCanIcon
            data-testid="reportDetailView-activitySection-deleteIcon"
            onClick={onDeleteAttachment}
          />
        </div>

        <div className={styles.itemActionButton} />
      </li>,
    };
  }), [attachmentsToAdd, setAttachmentsToAdd]);

  const sortedItemsRendered = useMemo(
    () => [...reportAttachmentsRendered, ...attachmentsToAddRendered]
      .sort((a, b) => {
        if (timeSortOrder === DESCENDING_SORT_ORDER) {
          return a.date > b.date ? 1 : -1;
        }
        return a.date < b.date ? 1 : -1;
      })
      .map((item) => item.node),
    [attachmentsToAddRendered, reportAttachmentsRendered, timeSortOrder]
  );

  return <>
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <BulletListIcon />

        <h2>Activity</h2>
      </div>

      {sortedItemsRendered.length > 0 && <div className={styles.actions}>
        <label>Time</label>

        <Button
          className={styles.timeSortButton}
          data-testid="reportDetailView-activitySection-timeSortButton"
          onClick={() => setTimeSortOrder(timeSortOrder === DESCENDING_SORT_ORDER
            ? ASCENDING_SORT_ORDER
            : DESCENDING_SORT_ORDER)}
          type="button"
          variant={timeSortOrder === DESCENDING_SORT_ORDER ? 'secondary' : 'primary'}
        >
          {timeSortOrder === DESCENDING_SORT_ORDER ? <ArrowDown /> : <ArrowUp />}
        </Button>

        <Button className={styles.expandAllButton} onClick={() => {}} type="button" variant="secondary">
          Expand All
        </Button>
      </div>}
    </div>

    {sortedItemsRendered.length > 0 && <ul className={styles.list}>{sortedItemsRendered}</ul>}
  </>;
};

ActivitySection.propTypes = {
  attachmentsToAdd: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
  })).isRequired,
  reportAttachments: PropTypes.arrayOf(PropTypes.shape({
    created_at: PropTypes.string,
    filename: PropTypes.string,
    id: PropTypes.string,
    updated_at: PropTypes.string,
    updates: PropTypes.arrayOf(PropTypes.object),
    url: PropTypes.string,
  })).isRequired,
  reportTracker: PropTypes.shape({
    track: PropTypes.func,
  }).isRequired,
  setAttachmentsToAdd: PropTypes.func.isRequired,
};

export default memo(ActivitySection);
