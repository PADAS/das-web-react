import React, { forwardRef, memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import { TrackerContext } from '../../../utils/analytics';

import { ReactComponent as ArrowDownSimpleIcon } from '../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as AttachmentIcon } from '../../../common/images/icons/attachment.svg';
import { ReactComponent as DownloadArrowIcon } from '../../../common/images/icons/download-arrow.svg';
import { ReactComponent as ExpandArrowIcon } from '../../../common/images/icons/expand-arrow.svg';
import { ReactComponent as ImageIcon } from '../../../common/images/icons/image.svg';
import { ReactComponent as TrashCanIcon } from '../../../common/images/icons/trash-can.svg';

import { addModal } from '../../../ducks/modals';
import { downloadFileFromUrl } from '../../../utils/download';
import { fetchImageAsBase64FromUrl } from '../../../utils/file';

import DateTime from '../../../DateTime';
import ImageModal from '../../../ImageModal';
import ItemActionButton from '../ItemActionButton';

import styles from '../styles.module.scss';

const AttachmentListItem = ({ attachment, cardsExpanded, onCollapse, onDelete, onExpand }, ref = null) => {
  const dispatch = useDispatch();

  const reportTracker = useContext(TrackerContext);

  const isNew = useMemo(() => !attachment.id, [attachment.id]);
  const isOpen = useMemo(() => cardsExpanded?.includes(attachment), [attachment, cardsExpanded]);

  const [imageThumbnailSource, setImageThumbnailSource] = useState(null);
  const [imageIconSource, setImageIconSource] = useState(null);
  const [imageOriginalSource, setImageOriginalSource] = useState(null);

  const currentImageSource = useMemo(() => imageOriginalSource || imageThumbnailSource, [imageOriginalSource, imageThumbnailSource]);

  const onShowImageFullScreen = useCallback((event) => {
    event.stopPropagation();

    dispatch(addModal({
      content: ImageModal,
      src: currentImageSource,
      title: attachment.filename,
      url: attachment.url,
    }));
  }, [attachment.filename, attachment.url, currentImageSource, dispatch]);

  const onClickDownloadIcon = useCallback(() => {
    downloadFileFromUrl(attachment.url, { filename: attachment.filename });

    reportTracker.track('Open Report Attachment');
  }, [attachment.filename, attachment.url, reportTracker]);

  useEffect(() => {
    if (attachment.file_type === 'image') {
      const downloadAndSetThumbnail = async () => {
        const source = await fetchImageAsBase64FromUrl(attachment.images.thumbnail);
        setImageThumbnailSource(source);
      };

      downloadAndSetThumbnail();
    }
  }, [attachment.file_type, attachment.images?.thumbnail]);

  useEffect(() => {
    if (attachment.file_type === 'image') {
      const downloadAndSetIcon = async () => {
        const source = await fetchImageAsBase64FromUrl(attachment.images.icon);
        setImageIconSource(source);
      };

      downloadAndSetIcon();
    }
  }, [attachment.file_type, attachment.images?.icon]);

  useEffect(() => {
    if (attachment.file_type === 'image') {
      const downloadAndSetOriginal = async () => {
        const source = await fetchImageAsBase64FromUrl(attachment.images.original);
        setImageOriginalSource(source);
      };

      downloadAndSetOriginal();
    }
  }, [attachment.file_type, attachment.images?.original]);

  if (attachment.file_type === 'image') {
    return <li className={isOpen ? styles.openItem : ''} ref={ref}>
      <div className={`${styles.itemRow} ${styles.collapseRow}`} onClick={isOpen ? onCollapse : onExpand}>
        {!!imageIconSource
          ? <img
            alt={`${attachment.filename} thumbnail`}
            className={styles.attachmentThumbnail}
            src={imageIconSource}
          />
          : <div className={styles.itemIcon}>
            <ImageIcon />
          </div>}

        <div className={styles.itemDetails}>
          <p className={styles.itemTitle}>{attachment.filename}</p>

          <DateTime
            className={styles.itemDate}
            data-testid={`reportManager-activitySection-dateTime-${attachment.id}`}
            date={attachment.updates[0].time}
            showElapsed={false}
          />
        </div>

        <div className={styles.itemActionButtonContainer}>
          <ItemActionButton onClick={onShowImageFullScreen} tooltip="Full View">
            <ExpandArrowIcon />
          </ItemActionButton>
        </div>

        <div className={styles.itemActionButtonContainer}>
          <ItemActionButton>
            {isOpen
              ? <ArrowUpSimpleIcon data-testid={`reportManager-activitySection-arrowUp-${attachment.id}`} />
              : <ArrowDownSimpleIcon data-testid={`reportManager-activitySection-arrowDown-${attachment.id}`} />}
          </ItemActionButton>
        </div>
      </div>

      <Collapse
        className={styles.collapse}
        data-testid={`reportManager-activitySection-collapse-${attachment.id}`}
        in={isOpen}
      >
        <div>
          <img
            alt={`${attachment.filename} preview`}
            className={styles.attachmentImagePreview}
            onClick={onShowImageFullScreen}
            src={currentImageSource}
          />
        </div>
      </Collapse>
    </li>;
  }

  return <li className={styles.itemRow} ref={ref}>
    <div className={styles.itemIcon}>
      <AttachmentIcon />
    </div>

    <div className={styles.itemDetails}>
      <p className={styles.itemTitle}>{attachment.filename || attachment.name}</p>

      {!!attachment.updates && <DateTime
        className={styles.itemDate}
        data-testid={`reportManager-activitySection-dateTime-${attachment.id}`}
        date={attachment.updates[0].time}
        showElapsed={false}
      />}
    </div>

    <div className={styles.itemActionButtonContainer}>
      <ItemActionButton onClick={!isNew ? onClickDownloadIcon : onDelete} tooltip={!isNew ? 'Download' : 'Delete'}>
        {!isNew
          ? <DownloadArrowIcon data-testid={`reportManager-activitySection-downloadArrow-${attachment.id}`} />
          : <TrashCanIcon
            data-testid={`reportManager-activitySection-trashCan-${attachment.filename || attachment.name}`}
          />}
      </ItemActionButton>
    </div>

    <div className={styles.itemActionButtonContainer} />
  </li>;
};

AttachmentListItem.defaultProps = {
  cardsExpanded: [],
  onCollapse: null,
  onDelete: null,
  onExpand: null,
  reportTracker: {},
};

AttachmentListItem.propTypes = {
  attachment: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    url: PropTypes.string,
    filename: PropTypes.string,
    updates: PropTypes.arrayOf(PropTypes.shape({
      time: PropTypes.string,
    })),
  }).isRequired,
  cardsExpanded: PropTypes.array,
  onCollapse: PropTypes.func,
  onDelete: PropTypes.func,
  onExpand: PropTypes.func,
  reportTracker: PropTypes.shape({
    track: PropTypes.func,
  }),
};

export default memo(forwardRef(AttachmentListItem));
