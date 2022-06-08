import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as AttachmentIcon } from '../../common/images/icons/attachment.svg';
import { ReactComponent as CloseIcon } from '../../common/images/icons/close-icon.svg';
import { ReactComponent as DownloadArrowIcon } from '../../common/images/icons/download-arrow.svg';

import { downloadFileFromUrl } from '../../utils/download';

import DateTime from '../../DateTime';

import styles from './styles.module.scss';

const ActivitySection = ({ attachmentsToAdd, reportAttachments, reportTracker, setAttachmentsToAdd }) => {
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

        <p className={styles.title}>{attachment.filename}</p>

        <DateTime className={styles.date} date={attachment.updates[0].time} showElapsed={false} />

        <div className={styles.actionButton}>
          <DownloadArrowIcon
            data-testid="reportDetailView-activitySection-downloadIcon"
            onClick={onDownloadAttachment}
          />
        </div>

        <div className={styles.actionButton} />
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

        <p className={styles.title}>{attachment.name}</p>

        <div className={styles.date} />

        <div className={styles.actionButton}>
          <CloseIcon
            data-testid="reportDetailView-activitySection-deleteIcon"
            onClick={onDeleteAttachment}
          />
        </div>

        <div className={styles.actionButton} />
      </li>,
    };
  }), [attachmentsToAdd, setAttachmentsToAdd]);

  const sortedItemsRendered = useMemo(
    () => [...reportAttachmentsRendered, ...attachmentsToAddRendered]
      .sort((a, b) => a.date > b.date ? 1 : -1 )
      .map((item) => item.node),
    [attachmentsToAddRendered, reportAttachmentsRendered]
  );

  // TODO: Match figma designs for Activity title
  return <>
    <h2>Activity</h2>

    <ul className={styles.list}>{sortedItemsRendered}</ul>
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
