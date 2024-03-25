import React, { forwardRef, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

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

const AttachmentListItem = ({ attachment, cardsExpanded, onCollapse, onDelete, onExpand }, ref) => {
  const dispatch = useDispatch();

  const tracker = useContext(TrackerContext);
  const { t } = useTranslation('details-view', { keyPrefix: 'attachmentListItem' });
  const isNew = useMemo(() => !attachment.id, [attachment.id]);
  const isOpen = useMemo(() => cardsExpanded?.includes(attachment), [attachment, cardsExpanded]);

  const [imageThumbnailSource, setImageThumbnailSource] = useState(null);
  const [imageIconSource, setImageIconSource] = useState(null);
  const [imageOriginalSource, setImageOriginalSource] = useState(null);

  const currentImageSource = useMemo(() => imageOriginalSource || imageThumbnailSource, [imageOriginalSource, imageThumbnailSource]);

  const onShowImageFullScreen = useCallback((event) => {
    event.stopPropagation();

    tracker.track('View fullscreen image from activity section');

    dispatch(addModal({
      content: ImageModal,
      src: currentImageSource,
      title: attachment.filename,
      tracker,
      url: attachment.url,
    }));
  }, [attachment.filename, attachment.url, currentImageSource, dispatch, tracker]);

  const onClickDownloadIcon = useCallback(() => {
    downloadFileFromUrl(attachment.url, { filename: attachment.filename });

    tracker.track('Download attachment');
  }, [attachment.filename, attachment.url, tracker]);

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
            data-testid={`activitySection-dateTime-${attachment.id}`}
            date={attachment.updates[0].time}
            showElapsed={false}
          />
        </div>

        <div className={styles.itemActionButtonContainer}>
          <ItemActionButton onClick={onShowImageFullScreen} tooltip={t('fullViewButtonTooltip')}>
            <ExpandArrowIcon />
          </ItemActionButton>
        </div>

        <div className={styles.itemActionButtonContainer}>
          <ItemActionButton
            aria-label={t(isOpen ? 'collapseOpenButtonLabel' : 'collapseClosedButtonLabel')}
            title={t(isOpen ? 'collapseOpenButtonTitle' : 'collapseClosedButtonTitle')}
          >
            {isOpen
              ? <ArrowUpSimpleIcon data-testid={`activitySection-arrowUp-${attachment.id}`} />
              : <ArrowDownSimpleIcon data-testid={`activitySection-arrowDown-${attachment.id}`} />}
          </ItemActionButton>
        </div>
      </div>

      <Collapse
        className={styles.collapse}
        data-testid={`activitySection-collapse-${attachment.id}`}
        in={isOpen}
      >
        <div>
          <img
            alt={t('imagePreviewAlt', {
              fileName: attachment.filename
            })}
            className={styles.attachmentImagePreview}
            onClick={onShowImageFullScreen}
            src={currentImageSource}
          />
        </div>
      </Collapse>
    </li>;
  }

  return <li className={`${styles.itemRow} ${styles.nonImageAttachment}`} ref={ref}>
    <div className={styles.itemIcon}>
      <AttachmentIcon />
    </div>

    <div className={styles.itemDetails}>
      <p className={styles.itemTitle}>{attachment.filename || attachment.name}</p>

      {!!attachment.updates && <DateTime
        className={styles.itemDate}
        data-testid={`activitySection-dateTime-${attachment.id}`}
        date={attachment.updates[0].time}
        showElapsed={false}
      />}
    </div>

    <div className={styles.itemActionButtonContainer}>
      <ItemActionButton onClick={!isNew ? onClickDownloadIcon : onDelete} tooltip={t(!isNew ? 'downloadButtonTooltip' : 'deleteButtonTooltip')}>
        {!isNew
          ? <DownloadArrowIcon data-testid={`activitySection-downloadArrow-${attachment.id}`} />
          : <TrashCanIcon
            data-testid={`activitySection-trashCan-${attachment.filename || attachment.name}`}
          />}
      </ItemActionButton>
    </div>

    <div className={styles.itemActionButtonContainer} />
  </li>;
};

const AttachmentListItemForwardRef = forwardRef(AttachmentListItem);

AttachmentListItemForwardRef.defaultProps = {
  cardsExpanded: [],
  onCollapse: null,
  onDelete: null,
  onExpand: null,
};

AttachmentListItemForwardRef.propTypes = {
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
};

export default AttachmentListItemForwardRef;
