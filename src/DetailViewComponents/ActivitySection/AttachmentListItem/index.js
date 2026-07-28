import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Collapse from 'react-bootstrap/Collapse';
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
import { ReactComponent as VideoIcon } from '../../../common/images/icons/video.svg';
import { ReactComponent as VolumeIcon } from '../../../common/images/icons/volume.svg';

import { addModal, updateModal } from '../../../ducks/modals';
import { downloadFileFromUrl } from '../../../utils/download';
import { fetchFileAsObjectUrlFromUrl, fetchImageAsBase64FromUrl } from '../../../utils/file';

import DateTime from '../../../DateTime';
import ImageModal from '../../../ImageModal';
import ItemActionButton from '../ItemActionButton';

import * as styles from '../styles.module.scss';

const AttachmentListItem = ({
  attachment,
  cardsExpanded = [],
  onCollapse = null,
  onDelete = null,
  onExpand = null,
  ref,
}) => {
  const dispatch = useDispatch();

  const tracker = useContext(TrackerContext);
  const { t } = useTranslation('details-view', { keyPrefix: 'attachmentListItem' });
  const isNew = useMemo(() => !attachment.id, [attachment.id]);
  const isOpen = useMemo(() => cardsExpanded?.includes(attachment), [attachment, cardsExpanded]);
  const isImage = attachment.file_type === 'image';
  const isVideo = attachment.file_type === 'video';
  const isAudio = attachment.file_type === 'audio';

  const [imageThumbnailSource, setImageThumbnailSource] = useState(null);
  const [imageIconSource, setImageIconSource] = useState(null);
  const [imageOriginalSource, setImageOriginalSource] = useState(null);
  const [mediaObjectUrl, setMediaObjectUrl] = useState(null);

  const currentImageSource = useMemo(() => imageOriginalSource || imageThumbnailSource, [imageOriginalSource, imageThumbnailSource]);

  const mediaFetchPromiseRef = useRef(null);
  const pendingModalIdRef = useRef(null);

  const ensureMediaObjectUrl = useCallback(() => {
    if (!mediaFetchPromiseRef.current) {
      mediaFetchPromiseRef.current = fetchFileAsObjectUrlFromUrl(attachment.url).then((objectUrl) => {
        setMediaObjectUrl(objectUrl);

        return objectUrl;
      });
    }

    return mediaFetchPromiseRef.current;
  }, [attachment.url]);

  const onShowFullScreen = useCallback((event) => {
    event.stopPropagation();

    tracker.track(`View fullscreen ${attachment.file_type} from activity section`);

    const modal = dispatch(addModal({
      content: ImageModal,
      mediaType: isVideo ? 'video' : 'image',
      src: isVideo ? mediaObjectUrl : currentImageSource,
      title: attachment.filename,
      tracker,
      url: attachment.url,
    }));

    if (isVideo && !mediaObjectUrl) {
      pendingModalIdRef.current = modal.id;

      ensureMediaObjectUrl();
    }
  }, [attachment.file_type, attachment.filename, attachment.url, currentImageSource, dispatch, ensureMediaObjectUrl, isVideo, mediaObjectUrl, tracker]);

  const onClickDownloadIcon = useCallback(() => {
    downloadFileFromUrl(attachment.url, { filename: attachment.filename });

    tracker.track('Download attachment');
  }, [attachment.filename, attachment.url, tracker]);

  useEffect(() => {
    if (isImage) {
      const downloadAndSetThumbnail = async () => {
        const source = await fetchImageAsBase64FromUrl(attachment.images.thumbnail);
        setImageThumbnailSource(source);
      };

      downloadAndSetThumbnail();
    }
  }, [isImage, attachment.images?.thumbnail]);

  useEffect(() => {
    if (isImage) {
      const downloadAndSetIcon = async () => {
        const source = await fetchImageAsBase64FromUrl(attachment.images.icon);
        setImageIconSource(source);
      };

      downloadAndSetIcon();
    }
  }, [isImage, attachment.images?.icon]);

  useEffect(() => {
    if (isImage) {
      const downloadAndSetOriginal = async () => {
        const source = await fetchImageAsBase64FromUrl(attachment.images.original);
        setImageOriginalSource(source);
      };

      downloadAndSetOriginal();
    }
  }, [isImage, attachment.images?.original]);

  useEffect(() => {
    if (isOpen && (isVideo || isAudio)) {
      ensureMediaObjectUrl();
    }
  }, [isOpen, isVideo, isAudio, ensureMediaObjectUrl]);

  useEffect(() => {
    if (mediaObjectUrl && pendingModalIdRef.current) {
      dispatch(updateModal({ id: pendingModalIdRef.current, src: mediaObjectUrl }));
      pendingModalIdRef.current = null;
    }
  }, [dispatch, mediaObjectUrl]);

  useEffect(() => () => {
    if (mediaObjectUrl) {
      URL.revokeObjectURL(mediaObjectUrl);
    }
  }, [mediaObjectUrl]);

  if (isImage || isVideo || isAudio) {
    return <li className={isOpen ? styles.openItem : ''} ref={ref}>
      <div className={`${styles.itemRow} ${styles.collapseRow}`} onClick={isOpen ? onCollapse : onExpand}>
        {isImage && (imageIconSource
          ? <img
            alt={`${attachment.filename} thumbnail`}
            className={styles.attachmentThumbnail}
            src={imageIconSource}
          />
          : <div className={styles.itemIcon}>
            <ImageIcon />
          </div>)}

        {isVideo && <div className={styles.itemIcon}>
          <VideoIcon />
        </div>}

        {isAudio && <div className={styles.itemIcon}>
          <VolumeIcon />
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
          {!isAudio && <ItemActionButton onClick={onShowFullScreen} tooltip={t('fullViewButtonTooltip')}>
            <ExpandArrowIcon data-testid="expand-arrow-icon" />
          </ItemActionButton>}
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
          {isImage && <img
            alt={t('imagePreviewAlt', {
              fileName: attachment.filename
            })}
            className={styles.attachmentImagePreview}
            onClick={onShowFullScreen}
            src={currentImageSource}
          />}

          {isVideo && (mediaObjectUrl
            ? <video
              aria-label={t('videoPreviewAlt', { fileName: attachment.filename })}
              className={styles.attachmentVideoPreview}
              controls
              data-testid={`activitySection-video-${attachment.id}`}
              src={mediaObjectUrl}
            />
            : <div className={styles.mediaLoadingSpinner} data-testid={`activitySection-mediaLoading-${attachment.id}`} />)}

          {isAudio && (mediaObjectUrl
            ? <audio
              aria-label={t('audioPreviewAlt', { fileName: attachment.filename })}
              className={styles.attachmentAudioPreview}
              controls
              data-testid={`activitySection-audio-${attachment.id}`}
              src={mediaObjectUrl}
            />
            : <div className={styles.mediaLoadingSpinner} data-testid={`activitySection-mediaLoading-${attachment.id}`} />)}
        </div>
      </Collapse>
    </li>;
  }

  return <li className={`${styles.itemRow} ${styles.nonImageAttachment}`} ref={ref}>
    <div className={styles.itemIcon}>
      <AttachmentIcon data-testid="attachment-icon" />
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

export default AttachmentListItem;
