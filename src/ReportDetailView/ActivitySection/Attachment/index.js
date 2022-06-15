import React, { memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as AttachmentIcon } from '../../../common/images/icons/attachment.svg';
import { ReactComponent as DownloadArrowIcon } from '../../../common/images/icons/download-arrow.svg';
import { ReactComponent as TrashCanIcon } from '../../../common/images/icons/trash-can.svg';

import { downloadFileFromUrl } from '../../../utils/download';

import DateTime from '../../../DateTime';

import styles from '../styles.module.scss';

const Attachment = ({ attachment, onDeleteAttachment, reportTracker }) => {
  const isNew = useMemo(() => !attachment.id, [attachment.id]);

  const onDelete = useCallback(() => {
    onDeleteAttachment(attachment);
  }, [attachment, onDeleteAttachment]);

  const onDownload = useCallback(() => {
    downloadFileFromUrl(attachment.url, { filename: attachment.filename });

    reportTracker.track('Open Report Attachment');
  }, [attachment.filename, attachment.url, reportTracker]);

  return <li className={styles.itemRow}>
    <div className={styles.itemIcon}>
      <AttachmentIcon />
    </div>

    <div className={styles.itemDetails}>
      <p className={styles.itemTitle}>{attachment.filename || attachment.name}</p>

      {!!attachment.updates && <DateTime
        className={styles.itemDate}
        data-testid="reportDetailView-activitySection-dateTime"
        date={attachment.updates[0].time}
        showElapsed={false}
      />}
    </div>

    <div className={styles.itemActionButton} />

    <div className={styles.itemActionButton}>
      {!isNew
        ? <DownloadArrowIcon
          data-testid={`reportDetailView-activitySection-downloadIcon-${attachment.id}`}
          onClick={onDownload}
        />
        : <TrashCanIcon
          data-testid={`reportDetailView-activitySection-deleteIcon-${attachment.name}`}
          onClick={onDelete}
        />}
    </div>

    <div className={styles.itemActionButton} />
  </li>;
};

Attachment.defaultProps = {
  onDeleteAttachment: null,
  reportTracker: {},
};

Attachment.propTypes = {
  attachment: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    url: PropTypes.string,
    filename: PropTypes.string,
    updates: PropTypes.arrayOf(PropTypes.shape({
      time: PropTypes.string,
    })),
  }).isRequired,
  onDeleteAttachment: PropTypes.func,
  reportTracker: PropTypes.shape({
    track: PropTypes.func,
  }),
};

export default memo(Attachment);
