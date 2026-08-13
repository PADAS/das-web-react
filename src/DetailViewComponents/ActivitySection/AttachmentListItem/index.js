import React, { memo, useContext, useEffect, useState } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

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
import { format, STANDARD_DATE_FORMAT } from '../../../utils/datetime';
import { TrackerContext } from '../../../utils/analytics';

import ImageModal from '../../../ImageModal';

import * as activitySectionStyles from '../styles.module.scss';
import * as styles from './styles.module.scss';

const ATTACHMENT_ANALYTICS_LABEL = 'attachment';

const useBase64ImageSource = (url) => {
  const [source, setSource] = useState(null);

  useEffect(() => {
    if (!url) {
      return undefined;
    }

    let isCancelled = false;

    const downloadSource = async () => {
      try {
        const result = await fetchImageAsBase64FromUrl(url);
        if (!isCancelled) {
          setSource(result);
        }
      } catch {
        // Attachment urls are signed and expire, so a rejection is expected.
      }
    };

    downloadSource();

    return () => {
      isCancelled = true;
    };
  }, [url]);

  return source;
};

const AttachmentListItem = ({
  attachment,
  isOpen = false,
  onCollapse = null,
  onDelete = null,
  onExpand = null,
  ref,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('details-view', { keyPrefix: 'attachmentListItem' });

  const tracker = useContext(TrackerContext);

  const isImageAttachment = attachment.file_type === 'image';

  const imageIconSource = useBase64ImageSource(isImageAttachment ? attachment.images?.icon : null);
  const imageOriginalSource = useBase64ImageSource(isImageAttachment ? attachment.images?.original : null);
  const imageThumbnailSource = useBase64ImageSource(isImageAttachment ? attachment.images?.thumbnail : null);

  const isNew = !attachment.id;
  const fileName = attachment.filename || attachment.name;
  const updateDate = attachment.updates?.[0]?.time ? new Date(attachment.updates[0].time) : null;

  const defaultImageSource = imageOriginalSource || imageThumbnailSource;

  const onShowImageFullScreen = (event) => {
    event.stopPropagation();

    dispatch(addModal({
      content: ImageModal,
      src: defaultImageSource,
      title: fileName,
      tracker,
      url: attachment.url,
    }));

    tracker.track('View fullscreen image from activity section');
  };

  const onClickDownloadIcon = () => {
    downloadFileFromUrl(attachment.url, { filename: fileName });

    tracker.track('Download attachment');
  };

  const onClickDeleteIcon = () => onDelete(attachment);

  const onToggleCollapseRow = () => (isOpen ? onCollapse : onExpand)(attachment, ATTACHMENT_ANALYTICS_LABEL);

  const onClickCollapseToggleButton = (event) => {
    event.preventDefault();
    event.stopPropagation();

    onToggleCollapseRow();
  };

  if (isImageAttachment) {
    return <li className={activitySectionStyles.listItem} ref={ref}>
      <div
        className={`${activitySectionStyles.itemRow} ${activitySectionStyles.collapseRow}`}
        onClick={onToggleCollapseRow}
      >
        {imageIconSource
          ? <img
            alt=""
            className={activitySectionStyles.attachmentThumbnail}
            src={imageIconSource}
          />
          : <div className={activitySectionStyles.itemIcon}>
            <ImageIcon aria-hidden="true" />
          </div>}

        <div className={activitySectionStyles.itemDetails}>
          <p className={activitySectionStyles.itemTitle}>{fileName}</p>

          {updateDate && <time
            className={activitySectionStyles.itemDate}
            data-testid={`activitySection-dateTime-${attachment.id}`}
            dateTime={updateDate.toISOString()}
          >
            {format(updateDate, STANDARD_DATE_FORMAT)}
          </time>}
        </div>

        <div className={activitySectionStyles.itemActionButtonContainer}>
          <button
            aria-label={t('fullViewButtonTooltip', { fileName })}
            className={`${activitySectionStyles.actionButton} ${styles.largeActionIcon}`}
            onClick={onShowImageFullScreen}
            title={t('fullViewButtonTooltip', { fileName })}
            type="button"
          >
            <ExpandArrowIcon aria-hidden="true" data-testid="expand-arrow-icon" />
          </button>
        </div>

        <div className={activitySectionStyles.itemActionButtonContainer}>
          <button
            aria-expanded={isOpen}
            aria-label={t(
              isOpen ? 'collapseOpenButtonLabel' : 'collapseClosedButtonLabel',
              { fileName }
            )}
            className={`${activitySectionStyles.actionButton} ${activitySectionStyles.collapseToggleButton}`}
            onClick={onClickCollapseToggleButton}
            title={t(
              isOpen ? 'collapseOpenButtonLabel' : 'collapseClosedButtonLabel',
              { fileName }
            )}
            type="button"
          >
            {isOpen
              ? <ArrowUpSimpleIcon aria-hidden="true" data-testid={`activitySection-arrowUp-${attachment.id}`} />
              : <ArrowDownSimpleIcon aria-hidden="true" data-testid={`activitySection-arrowDown-${attachment.id}`} />}
          </button>
        </div>
      </div>

      <Collapse
        className={activitySectionStyles.collapse}
        data-testid={`activitySection-collapse-${attachment.id}`}
        in={isOpen}
      >
        <div>
          <div>
            <img
              alt={t('imagePreviewAlt', { fileName })}
              className={activitySectionStyles.attachmentImagePreview}
              onClick={onShowImageFullScreen}
              src={defaultImageSource}
            />
          </div>
        </div>
      </Collapse>
    </li>;
  }

  return <li
      className={`${activitySectionStyles.listItem} ${activitySectionStyles.itemRow} ${activitySectionStyles.nonImageAttachment}`}
      ref={ref}
    >
    <div className={activitySectionStyles.itemIcon}>
      <AttachmentIcon aria-hidden="true" data-testid="attachment-icon" />
    </div>

    <div className={activitySectionStyles.itemDetails}>
      <p className={activitySectionStyles.itemTitle}>{fileName}</p>

      {updateDate && <time
        className={activitySectionStyles.itemDate}
        data-testid={`activitySection-dateTime-${attachment.id}`}
        dateTime={updateDate.toISOString()}
      >
        {format(updateDate, STANDARD_DATE_FORMAT)}
      </time>}
    </div>

    <div className={activitySectionStyles.itemActionButtonContainer}>
      <button
        aria-label={t(isNew ? 'deleteButtonTooltip' : 'downloadButtonTooltip', { fileName })}
        className={`${activitySectionStyles.actionButton} ${styles.largeActionIcon}`}
        onClick={isNew ? onClickDeleteIcon : onClickDownloadIcon}
        title={t(isNew ? 'deleteButtonTooltip' : 'downloadButtonTooltip', { fileName })}
        type="button"
      >
        {isNew
          ? <TrashCanIcon aria-hidden="true" data-testid={`activitySection-trashCan-${fileName}`} />
          : <DownloadArrowIcon aria-hidden="true" data-testid={`activitySection-downloadArrow-${attachment.id}`} />}
      </button>
    </div>

    <div className={activitySectionStyles.itemActionButtonContainer} />
  </li>;
};

export default memo(AttachmentListItem);
