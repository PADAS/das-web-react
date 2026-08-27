import React, { memo, useCallback, useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TrackerContext } from '../utils/analytics';

import { ReactComponent as AttachmentIcon } from '../common/images/icons/attachment.svg';

import * as styles from './styles.module.scss';

const ATTACHMENT_FILE_TYPES_ACCEPTED = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/*',
  'text/plain',
  '.csv',
  '.doc',
  '.docx',
  '.pdf',
  '.xlsx',
  '.xml',
  '.mp3',
  '.wav',
  '.aif',
  '.flac',
  '.ogg',
  '.ogv',
  '.pcm',
  '.aac',
  '.mp4',
  '.avi',
  '.mov',
  '.webm',
  '.mkv',
  '.wmv'
].join(', ');

const AddAttachmentButton = ({ onAddAttachments }) => {
  const fileInputRef = useRef();
  const { t } = useTranslation('details-view');

  const analytics = useContext(TrackerContext);

  const [draggingOver, setDraggingOver] = useState(false);

  const onAttachmentButtonClick = useCallback(() => {
    analytics?.track('Start adding attachment');

    fileInputRef.current.click();
  }, [analytics]);

  const onAttachmentButtonDragLeave = useCallback((event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDraggingOver(false);
    }
  }, []);

  const onAttachmentButtonDragOver = useCallback((event) => {
    event.preventDefault();

    analytics?.track('Drag in attachment');

    setDraggingOver(true);
  }, [analytics]);

  const onAttachmentButtonDrop = useCallback((event) => {
    event.preventDefault();

    analytics?.track('Drop dragged attachment');

    setDraggingOver(false);
    onAddAttachments(event.dataTransfer.files);
    fileInputRef.current.value = '';
  }, [analytics, onAddAttachments]);

  const onChangeFileInput = useCallback(() => {
    analytics?.track('Add attachment');

    onAddAttachments(fileInputRef.current.files);
    fileInputRef.current.value = '';
  }, [analytics, onAddAttachments]);

  return <>
    <input
      accept={ATTACHMENT_FILE_TYPES_ACCEPTED}
      data-testid="addAttachmentButton"
      multiple
      onChange={onChangeFileInput}
      ref={fileInputRef}
      style={{ display: 'none' }}
      type="file"
    />

    <button
      aria-label={t('addAttachmentButtonLabel')}
      className={`${styles.addAttachmentButton} ${draggingOver ? styles.draggingOver : ''}`}
      onClick={onAttachmentButtonClick}
      onDragLeave={onAttachmentButtonDragLeave}
      onDragOver={onAttachmentButtonDragOver}
      onDrop={onAttachmentButtonDrop}
      title={t('addAttachmentButtonLabel')}
      type="button"
      >
      <AttachmentIcon aria-hidden="true" />

      <span>{t('addAttachmentButton')}</span>
    </button>
  </>;
};

export default memo(AddAttachmentButton);
