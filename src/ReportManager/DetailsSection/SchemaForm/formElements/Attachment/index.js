import React, { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as AttachmentIcon } from '../../../../../common/images/icons/attachment.svg';
import { ReactComponent as CloudUploadIcon } from '../../../../../common/images/icons/cloud-upload.svg';
import { ReactComponent as DownloadArrowIcon } from '../../../../../common/images/icons/download-arrow.svg';
import { ReactComponent as ExpandArrowIcon } from '../../../../../common/images/icons/expand-arrow.svg';
import { ReactComponent as TrashCanIcon } from '../../../../../common/images/icons/trash-can.svg';
import { ReactComponent as VideoIcon } from '../../../../../common/images/icons/video.svg';
import { ReactComponent as VolumeIcon } from '../../../../../common/images/icons/volume.svg';

import { addModal } from '../../../../../ducks/modals';
import {
  convertFileListToArray,
  fetchImageAsBase64FromUrl,
  filterDuplicateUploadFilenames,
} from '../../../../../utils/file';
import { downloadFileFromUrl } from '../../../../../utils/download';
import { removeFile, uploadFile } from '../../../../../ducks/user-content';
import { selectUploadStatesByIds } from '../../../../../selectors/user-content';
import { showToast } from '../../../../../utils/toast';
import { TrackerContext } from '../../../../../utils/analytics';

import ImageModal from '../../../../../ImageModal';

import * as styles from './styles.module.scss';

const ATTACHMENT_FIELD_ALLOWABLE_FILE_TYPE_SPECIFIERS = {
  audio: ['audio/*'],
  document: [
    '.csv',
    '.doc',
    '.docx',
    '.odp',
    '.ods',
    '.odt',
    '.pdf',
    '.ppt',
    '.pptx',
    '.txt',
    '.xls',
    '.xlsx',
    'application/msword',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/vnd.oasis.opendocument.presentation',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'text/plain',
  ],
  image: ['image/*'],
  video: ['video/*'],
};

const getFileCategoryFromMimeType = (mimeType) => {
  if ((mimeType).startsWith('image/')) {
    return 'image';
  }

  if ((mimeType).startsWith('audio/')) {
    return 'audio';
  }

  if ((mimeType).startsWith('video/')) {
    return 'video';
  }

  return 'document';
};

const isFileTypeAllowed = (file, allowableFileTypes) => {
  if (allowableFileTypes.length === 0) {
    return true;
  }

  return allowableFileTypes.some((fileType) => {
    const specifiers = ATTACHMENT_FIELD_ALLOWABLE_FILE_TYPE_SPECIFIERS[fileType] ?? [];

    return specifiers.some((specifier) => {
      if (specifier.startsWith('.')) {
        return (file.name || '').toLowerCase().endsWith(specifier);
      }

      if (specifier.endsWith('/*')) {
        return file.type.startsWith(specifier.slice(0, -1));
      }

      return file.type === specifier;
    });
  });
};

const AttachmentListItem = ({ actionButtonRefs, attachment, onRemove, readOnly }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.schemaForm.fields.attachment' });

  const tracker = useContext(TrackerContext);

  const actionButtonRef = (node) => {
    if (node) {
      actionButtonRefs.current.set(attachment.uploadId, node);
    } else {
      actionButtonRefs.current.delete(attachment.uploadId);
    }
  };

  let icon = <AttachmentIcon />;
  if (attachment.status === 'in_progress') {
    icon = <span
      className={`${styles.uploadProgress} ${attachment.progress === null ? styles.indeterminate : ''}`}
      data-testid={`upload-progress-${attachment.uploadId}`}
      style={{ '--upload-progress': `${Math.round((attachment.progress ?? 0) * 100)}%` }}
    />;
  } else if (attachment.status === 'unknown') {
    icon = <CloudUploadIcon />;
  } else if (attachment.thumbnailImageSource) {
    icon = <img alt="" className={styles.thumbnail} src={attachment.thumbnailImageSource}/>;
  } else if (attachment.fileType === 'audio') {
    icon = <VolumeIcon />;
  } else if (attachment.fileType === 'video') {
    icon = <VideoIcon />;
  }

  let actionButton = null;
  if (attachment.isLocalUpload) {
    if (!readOnly) {
      actionButton = <button
          aria-label={t('removeButtonLabel', { fileName: attachment.name })}
          className={styles.actionButton}
          onClick={() => onRemove()}
          ref={actionButtonRef}
          title={t('removeButtonLabel', { fileName: attachment.name })}
          type="button"
        >
        <TrashCanIcon aria-hidden="true" />
      </button>;
    }
  } else if (attachment.status === 'complete') {
    if (attachment.fileType === 'image') {
      actionButton = <button
        aria-label={t('expandButtonLabel', { fileName: attachment.name })}
        className={styles.actionButton}
        disabled={!attachment.originalImageSource && !attachment.thumbnailImageSource}
        onClick={() => dispatch(addModal({
          content: ImageModal,
          src: attachment.originalImageSource ?? attachment.thumbnailImageSource,
          title: attachment.name,
          tracker,
          url: attachment.originalUrl,
        }))}
        ref={actionButtonRef}
        title={t('expandButtonLabel', { fileName: attachment.name })}
        type="button"
        >
        <ExpandArrowIcon aria-hidden="true" />
      </button>;
    } else {
      actionButton = <button
        aria-label={t('downloadButtonLabel', { fileName: attachment.name })}
        className={styles.actionButton}
        onClick={() => downloadFileFromUrl(attachment.originalUrl, { filename: attachment.name })}
        ref={actionButtonRef}
        title={t('downloadButtonLabel', { fileName: attachment.name })}
        type="button"
        >
        <DownloadArrowIcon aria-hidden="true" />
      </button>;
    }
  }

  return <li className={styles.attachmentListItem}>
    <span aria-hidden="true" className={styles.icon}>{icon}</span>

    <span className={styles.name}>{attachment.name}</span>

    {attachment.status === 'unknown' && <span className={styles.pendingLabel}>{t('pendingLabel')}</span>}

    {attachment.status === 'failed' && <span className={styles.error}>{t('uploadErrorLabel')}</span>}

    {actionButton}
  </li>;
};

const Attachment = ({ attachmentsMetadata, details, error, id, onFieldChange, readOnly, value = [] }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.schemaForm.fields.attachment' });

  const uploadIds = useMemo(
    () => value.map((attachment) => attachment?.uploadId).filter(Boolean),
    [value]
  );

  const uploads = useSelector(
    (state) => selectUploadStatesByIds(state, uploadIds),
    shallowEqual
  );

  const fetchedImageDataRef = useRef(new Set());

  const actionButtonRefs = useRef(new Map());
  const chooseFileButtonRef = useRef();
  const fileInputRef = useRef();
  const nextFocusTargetRef = useRef();
  const prevUploadsRef = useRef(null);

  const [announcement, setAnnouncement] = useState('');
  const [draggingOver, setDraggingOver] = useState(false);
  const [metadataImageSources, setMetadataImageSources] = useState({});

  const hasError = !!error?.message;

  const attachments = useMemo(() => value.map((attachment) => {
    const attachmentMetadata = attachmentsMetadata?.[attachment?.uploadId] ?? {};
    const attachmentImageSources = metadataImageSources[attachment?.uploadId] ?? {};
    const upload = uploads[attachment?.uploadId];

    return {
      fileType: attachmentMetadata?.file_type ?? getFileCategoryFromMimeType(upload?.fileType ?? ''),
      isLocalUpload: !!upload,
      name: attachmentMetadata?.filename?.split('/').pop() ?? upload?.filename,
      originalImageSource: attachmentImageSources.original ?? upload?.objectUrl,
      originalUrl: attachmentMetadata?.files?.original,
      progress: upload?.progress ?? null,
      status: upload?.status ?? attachmentMetadata.status ?? 'complete',
      thumbnailImageSource: attachmentImageSources.thumbnail ?? upload?.objectUrl,
      uploadId: attachment?.uploadId,
    };
  }), [attachmentsMetadata, metadataImageSources, uploads, value]);

  const isMaxItemsReached = details.maxItems !== null && attachments.length >= details.maxItems;

  const isInteractive = !readOnly && !isMaxItemsReached;

  const onAddAttachments = (newFiles) => {
    let newAttachments = [];
    newFiles.forEach((file) => {
      if (isFileTypeAllowed(file, details.allowableFileTypes)) {
        newAttachments.push(file);
      } else {
        showToast({ message: t('disallowedTypeAlert', { fileName: file.name }) });
      }
    });

    newAttachments = filterDuplicateUploadFilenames(
      attachments.map((attachment) => ({ name: attachment.name })),
      newAttachments
    );

    const availableSlots = details.maxItems === null
      ? newAttachments.length
      : details.maxItems - attachments.length;
    if (newAttachments.length > availableSlots) {
      newAttachments = newAttachments.slice(0, Math.max(0, availableSlots));

      showToast({ message: t('maxItemsAlert', { count: details.maxItems }) });
    }

    const newUploadIds = newAttachments.map((file) => dispatch(uploadFile(file)));

    if (newUploadIds.length > 0) {
      setAnnouncement(t('uploadStartedAnnouncement', {
        count: newAttachments.length,
        fileName: newAttachments[0].name,
      }));

      onFieldChange(id, [...value, ...newUploadIds.map((uploadId) => ({ uploadId }))]);
    }
  };

  const onClickRemove = (attachment) => {
    const attachmentIndex = attachments.indexOf(attachment);

    // Focus the next attachment that has an action button.
    const remainingAttachmentsFocusOrder = [
      ...attachments.slice(attachmentIndex + 1),
      ...attachments.slice(0, attachmentIndex).reverse(),
    ];
    const attachmentToFocus = remainingAttachmentsFocusOrder.find(
      (attachment) => actionButtonRefs.current.has(attachment.uploadId)
    );
    nextFocusTargetRef.current = attachmentToFocus
      ? actionButtonRefs.current.get(attachmentToFocus.uploadId)
      : chooseFileButtonRef.current;

    onFieldChange(id, [...value.slice(0, attachmentIndex), ...value.slice(attachmentIndex + 1)]);

    dispatch(removeFile(attachment.uploadId));
  };

  const onChangeFileInput = (event) => {
    onAddAttachments(convertFileListToArray(event.currentTarget.files));

    // Reset so selecting the same file again still fires onChange.
    event.currentTarget.value = '';
  };

  const onDragEnter = (event) => {
    if (isInteractive) {
      event.preventDefault();

      setDraggingOver(true);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();

    if (isInteractive) {
      onAddAttachments(convertFileListToArray(event.dataTransfer.files));
    }

    setDraggingOver(false);
  };

  useEffect(() => {
    if (nextFocusTargetRef.current) {
      const target = nextFocusTargetRef.current;
      nextFocusTargetRef.current = null;
      target.focus();
    }
  }, [attachments]);

  useEffect(() => {
    const prevUploads = prevUploadsRef.current;
    prevUploadsRef.current = uploads;

    if (prevUploads !== null) {
      // Uploads changed. Announce status transitions.
      const newlyCompletedUploads = Object.values(uploads).filter(
        (upload) => upload?.status === 'complete' && prevUploads[upload.uploadId]?.status !== 'complete'
      );
      const newlyFailedUploads = Object.values(uploads).filter(
        (upload) => upload?.status === 'failed' && prevUploads[upload.uploadId]?.status !== 'failed'
      );

      const announcementParts = [];
      if (newlyCompletedUploads.length > 0) {
        announcementParts.push(t('uploadSucceededAnnouncement', { count: newlyCompletedUploads.length, fileName: newlyCompletedUploads[0].filename }));
      }

      if (newlyFailedUploads.length > 0) {
        announcementParts.push(t('uploadFailedAnnouncement', { count: newlyFailedUploads.length, fileName: newlyFailedUploads[0].filename }));
      }

      if (announcementParts.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAnnouncement(announcementParts.join(' '));
      }
    }
  }, [t, uploads]);

  useEffect(() => {
    let cancelled = false;

    const uploadIdsSet = new Set(value.map((attachment) => attachment.uploadId));
    fetchedImageDataRef.current.forEach((id) => {
      if (!uploadIdsSet.has(id)) {
        // A removed upload still has fetched image data. Delete it.
        fetchedImageDataRef.current.delete(id);
      }
    });

    value.forEach((attachment) => {
      const attachmentMetadata = attachmentsMetadata?.[attachment.uploadId];

      if (attachmentMetadata
        && attachmentMetadata.file_type === 'image'
        && !fetchedImageDataRef.current.has(attachment.uploadId)) {
        // There are saved images that haven't been fetched yet. Fetch them
        // them and store their image sources.
        fetchedImageDataRef.current.add(attachment.uploadId);

        const downloadAndSetImageData = async () => {
          try {
            const [original, thumbnail] = await Promise.all([
              fetchImageAsBase64FromUrl(attachmentMetadata.files.original),
              fetchImageAsBase64FromUrl(attachmentMetadata.files.thumbnail),
            ]);

            if (!cancelled) {
              setMetadataImageSources((prevMetadataImageSources) => ({
                ...prevMetadataImageSources,
                [attachment.uploadId]: { original, thumbnail },
              }));
            }
          } catch {
            // Image fetch failed; swallow the error. The thumbnail will not be
            // shown.
          }
        };

        downloadAndSetImageData();
      }
    });

    return () => { cancelled = true; };
  }, [attachmentsMetadata, value]);

  return <div
      aria-describedby={`${id}-description`}
      aria-errormessage={hasError ? `${id}-description` : undefined}
      aria-invalid={hasError ? 'true' : 'false'}
      aria-labelledby={`${id}-label`}
      className={styles.attachment}
      data-testid={`schema-form-attachment-field-${id}`}
      id={id}
      onDragEnter={onDragEnter}
      onDragLeave={(event) => !event.currentTarget.contains(event.relatedTarget) && setDraggingOver(false)}
      onDragOver={(event) => isInteractive && event.preventDefault()}
      onDrop={onDrop}
      role="group"
      tabIndex={-1}
    >
    <span className={`${styles.label} ${hasError ? styles.error : ''}`} id={`${id}-label`}>
      {details.label}

      {details.isRequired && <>
        <span aria-hidden="true"> *</span>

        <span className="sr-only"> {t('requiredLabel')}</span>
      </>}
    </span>

    <div aria-live="polite" className="sr-only" role="status">{announcement}</div>

    {attachments.length === 0
      ? <div
        className={`${styles.dropzone} ${draggingOver ? styles.draggingOver : ''}`}
        data-testid={`schema-form-attachment-field-${id}-dropzone`}
      >
        <CloudUploadIcon aria-hidden="true" className={styles.icon} />

        <p className={styles.text}>{t('dropzoneText')}</p>
      </div>
      : <ul className={`${styles.attachmentsList} ${draggingOver ? styles.draggingOver : ''}`} role="list">
        {attachments.map((attachment) => <AttachmentListItem
          actionButtonRefs={actionButtonRefs}
          attachment={attachment}
          key={attachment.uploadId}
          onRemove={() => onClickRemove(attachment)}
          readOnly={readOnly}
        />)}
      </ul>}

    <p
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${id}-description`}
    >
      {error?.message || details.description}
    </p>

    {!readOnly && <>
      <input
        accept={details.allowableFileTypes.length === 0 ? undefined : details.allowableFileTypes
          .flatMap((fileType) => ATTACHMENT_FIELD_ALLOWABLE_FILE_TYPE_SPECIFIERS[fileType] ?? [])
          .join(',')}
        className={styles.fileInput}
        data-testid={`schema-form-attachment-field-${id}-file-input`}
        multiple
        onChange={onChangeFileInput}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      <button
        className={styles.chooseFileButton}
        disabled={isMaxItemsReached}
        onClick={() => fileInputRef.current?.click()}
        ref={chooseFileButtonRef}
        type="button"
      >
        <AttachmentIcon aria-hidden="true" className={styles.chooseFileIcon} />

        {t('chooseFile')}
      </button>
    </>}
  </div>;
};

export default memo(Attachment);
