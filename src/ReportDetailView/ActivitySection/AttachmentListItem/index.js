import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as ArrowDownSmallIcon } from '../../../common/images/icons/arrow-down-small.svg';
import { ReactComponent as ArrowUpSmallIcon } from '../../../common/images/icons/arrow-up-small.svg';
import { ReactComponent as AttachmentIcon } from '../../../common/images/icons/attachment.svg';
import { ReactComponent as DownloadArrowIcon } from '../../../common/images/icons/download-arrow.svg';
import { ReactComponent as ExpandArrowIcon } from '../../../common/images/icons/expand-arrow.svg';
import { ReactComponent as TrashCanIcon } from '../../../common/images/icons/trash-can.svg';

import { downloadFileFromUrl } from '../../../utils/download';
import { fetchImageAsBase64FromUrl } from '../../../utils/file';
import { showFullScreenImage } from '../../../ducks/full-screen-image';

import DateTime from '../../../DateTime';

import styles from '../styles.module.scss';

const AttachmentListItem = ({ attachment, cardsExpanded, onCollapse, onDelete, onExpand, reportTracker }) => {
  const dispatch = useDispatch();

  const {
    file: fullScreenImageFile,
    source: fullScreenImageSource,
  } = useSelector((state) => state.view.fullScreenImage);

  const isNew = useMemo(() => !attachment.id, [attachment.id]);
  const isOpen = useMemo(() => cardsExpanded?.includes(attachment), [attachment, cardsExpanded]);

  const [imageThumbnailSource, setImageThumbnailSource] = useState(null);
  const [imageIconSource, setImageIconSource] = useState(null);
  const [imageOriginalSource, setImageOriginalSource] = useState(null);

  const currentImageSource = useMemo(() => imageOriginalSource || imageThumbnailSource, [imageOriginalSource, imageThumbnailSource]);

  const onShowImageFullScreen = useCallback(() => {
    dispatch(showFullScreenImage(attachment, currentImageSource));
  }, [attachment, currentImageSource, dispatch]);

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

  useEffect(() => {
    const shouldReplaceFullScreenImage = !!fullScreenImageSource
      && fullScreenImageFile === attachment
      && fullScreenImageSource !== currentImageSource;
    if (attachment.file_type === 'image' && shouldReplaceFullScreenImage) {
      dispatch(showFullScreenImage(attachment, currentImageSource));
    }
  }, [attachment, currentImageSource, dispatch, fullScreenImageFile, fullScreenImageSource]);

  if (attachment.file_type === 'image') {
    return <li className={isOpen ? styles.openItem : ''}>
      <div className={styles.itemRow}>
        {!!imageIconSource
          ? <img alt="Thumbnail" className={styles.attachmentThumbnail} src={imageIconSource} />
          : <div className={styles.itemIcon}>
            <AttachmentIcon />
          </div>}

        <div className={styles.itemDetails}>
          <p className={styles.itemTitle}>{attachment.filename || attachment.name}</p>

          {!!attachment.updates && <DateTime
            className={styles.itemDate}
            data-testid={`reportDetailView-activitySection-dateTime-${attachment.id}`}
            date={attachment.updates[0].time}
            showElapsed={false}
          />}
        </div>

        <div className={styles.itemActionButton} />

        <div className={styles.itemActionButton}>
          {!isNew
            ? <ExpandArrowIcon onClick={onShowImageFullScreen} />
            : <TrashCanIcon onClick={(onDelete)} />}
        </div>

        <div className={styles.itemActionButton}>
          {isOpen
            ? <ArrowUpSmallIcon onClick={onCollapse} />
            : <ArrowDownSmallIcon onClick={onExpand} />}
        </div>
      </div>

      <Collapse
        className={styles.collapse}
        data-testid={`reportDetailView-activitySection-collapse-${attachment.id || attachment.name}`}
        in={isOpen}
      >
        <div>
          <img
            alt="Thumbnail"
            className={styles.attachmentImagePreview}
            onClick={onShowImageFullScreen}
            src={currentImageSource}
          />
        </div>
      </Collapse>
    </li>;
  }

  return <li className={styles.itemRow}>
    <div className={styles.itemIcon}>
      <AttachmentIcon />
    </div>

    <div className={styles.itemDetails}>
      <p className={styles.itemTitle}>{attachment.filename || attachment.name}</p>

      {!!attachment.updates && <DateTime
        className={styles.itemDate}
        data-testid={`reportDetailView-activitySection-dateTime-${attachment.id}`}
        date={attachment.updates[0].time}
        showElapsed={false}
      />}
    </div>

    <div className={styles.itemActionButton} />

    <div className={styles.itemActionButton}>
      {!isNew
        ? <DownloadArrowIcon onClick={onClickDownloadIcon} />
        : <TrashCanIcon onClick={(onDelete)} />}
    </div>

    <div className={styles.itemActionButton} />
  </li>;
};

AttachmentListItem.defaultProps = {
  onDelete: null,
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
  cardsExpanded: PropTypes.array.isRequired,
  onCollapse: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onExpand: PropTypes.func.isRequired,
  reportTracker: PropTypes.shape({
    track: PropTypes.func,
  }),
};

export default memo(AttachmentListItem);
