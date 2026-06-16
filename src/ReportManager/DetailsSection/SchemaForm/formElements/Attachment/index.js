import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import { ReactComponent as AttachmentIcon } from '../../../../../common/images/icons/attachment.svg';
import { ReactComponent as CloudUploadIcon } from '../../../../../common/images/icons/cloud-upload.svg';
import { ReactComponent as TrashCanIcon } from '../../../../../common/images/icons/trash-can.svg';

import { convertFileListToArray, filterDuplicateUploadFilenames } from '../../../../../utils/file';
import { showToast } from '../../../../../utils/toast';
import { uploadFile } from '../../../../../ducks/user-content';
import { selectUploadStatesByIds } from '../../../../../selectors/user-content';

import * as styles from './styles.module.scss';

const ATTACHMENT_FIELD_ALLOWABLE_FILE_TYPE_SPECIFIERS = {
  audio: ['audio/*'],
  document: [
    '.csv',
    '.doc',
    '.docx',
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
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'text/plain',
  ],
  image: ['image/*'],
  video: ['video/*'],
};

const getAcceptAttributeForFileTypes = (allowableFileTypes) => {
  if (allowableFileTypes.length === 0) {
    return undefined;
  }

  return allowableFileTypes
    .flatMap((fileType) => ATTACHMENT_FIELD_ALLOWABLE_FILE_TYPE_SPECIFIERS[fileType] ?? [])
    .join(',');
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

const Attachment = ({ details, error, id, onFieldChange, readOnly, value = [] }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.schemaForm.fields.attachment' });

  const announcedUploadIdsRef = useRef(new Set());
  const chooseFileButtonRef = useRef();
  const fileInputRef = useRef();
  const nextFocusTargetRef = useRef();
  const removeButtonRefs = useRef(new Map());
  // Keep a ref to the latest uploads so the unmount cleanup effect can read the
  // current value without a stale closure.
  const uploadsRef = useRef([]);

  const [announcement, setAnnouncement] = useState('');
  const [draggingOver, setDraggingOver] = useState(false);
  const [uploads, setUploads] = useState([]);

  const uploadIds = useMemo(
    () => uploads.map((upload) => upload.uploadId).filter(Boolean),
    [uploads]
  );

  const uploadStatesByIds = useSelector(
    (state) => selectUploadStatesByIds(state, uploadIds),
    shallowEqual
  );

  const hasError = !!error?.message;

  const files = useMemo(() => [
    ...uploads,
    ...value.map((attachment, index) => ({
      // TODO: Get file metadata (name, previewUrl) for existing uploads.
      localId: attachment.uploadId,
      name: attachment.name ?? `${t('savedAttachment')} ${index + 1}`,
      uploadId: attachment.uploadId,
    })),
  ], [t, uploads, value]);

  const isMaxItemsReached = details.maxItems !== null && files.length >= details.maxItems;

  const isInteractive = !readOnly && !isMaxItemsReached;

  // Method to update uploads state and keep uploadsRef in sync.
  const updateUploads = (updater) => setUploads((prevUploads) => {
    const nextUploads = typeof updater === 'function' ? updater(prevUploads) : updater;
    uploadsRef.current = nextUploads;

    return nextUploads;
  });

  const startUpload = async (file) => {
    const controller = new AbortController();
    const localId = uuidv4();
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;

    // Add immediately so the user sees the entry before the server responds.
    updateUploads((prevUploads) => [
      ...prevUploads,
      {
        controller,
        localId,
        name: file.name,
        previewUrl,
        uploadId: null,
      },
    ]);
    setAnnouncement(t('uploadStartedAnnouncement', { fileName: file.name }));

    try {
      const uploadId = await dispatch(uploadFile(file, controller.signal));

      updateUploads((prevUploads) => prevUploads.map((upload) =>
        upload.localId === localId ? { ...upload, uploadId } : upload
      ));
    } catch {
      if (!controller.signal.aborted) {
        // Unexpected failure. Revoke the object URL, remove the entry, and
        // notify the user.
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        updateUploads((prevUploads) => prevUploads.filter((prevUpload) => prevUpload.localId !== localId));

        showToast({ message: t('uploadFailedAnnouncement', { count: 1, fileName: file.name }) });
      }
    }
  };

  const onAddFiles = (newFiles) => {
    let filesToUpload = [];
    newFiles.forEach((file) => {
      if (isFileTypeAllowed(file, details.allowableFileTypes)) {
        filesToUpload.push(file);
      } else {
        showToast({ message: t('disallowedTypeAlert', { fileName: file.name }) });
      }
    });

    filesToUpload = filterDuplicateUploadFilenames(
      files.map((entry) => ({ name: entry.name })),
      filesToUpload
    );

    const availableSlots = details.maxItems === null ? filesToUpload.length : details.maxItems - files.length;
    if (filesToUpload.length > availableSlots) {
      // Maximum number of attachments reached. Slice the files to the
      // available slots and show a toast.
      filesToUpload = filesToUpload.slice(0, Math.max(0, availableSlots));

      showToast({ message: t('maxItemsAlert', { count: details.maxItems }) });
    }

    filesToUpload.forEach((file) => startUpload(file));
  };

  const onClickRemove = (fileIndex) => () => {
    const file = files[fileIndex];
    const nextFile = files[fileIndex + 1] ?? files[fileIndex - 1];
    nextFocusTargetRef.current = nextFile
      ? removeButtonRefs.current.get(nextFile.localId)
      : chooseFileButtonRef.current;

    file.controller?.abort();
    if (file.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }

    updateUploads((prevUploads) => prevUploads.filter((prevUpload) => prevUpload.localId !== file.localId));

    const newValue = value.filter((attachment) => attachment.uploadId !== file.uploadId);
    if (newValue.length !== value.length) {
      onFieldChange(id, newValue);
    }
  };

  const onChangeFileInput = (event) => {
    onAddFiles(convertFileListToArray(event.currentTarget.files));

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
      onAddFiles(convertFileListToArray(event.dataTransfer.files));
    }

    setDraggingOver(false);
  };

  useEffect(() => {
    if (nextFocusTargetRef.current) {
      const target = nextFocusTargetRef.current;
      nextFocusTargetRef.current = null;
      target.focus();
    }
  }, [files]);

  useEffect(() => {
    // Calculate the newly completed and failed uploads.
    const newlyCompletedUploads = [];
    const newlyFailedUploads = [];
    uploads.forEach((upload) => {
      if (upload.uploadId && !announcedUploadIdsRef.current.has(upload.uploadId)) {
        const uploadState = uploadStatesByIds[upload.uploadId];

        if (uploadState?.status === 'complete') {
          newlyCompletedUploads.push(upload);
          announcedUploadIdsRef.current.add(upload.uploadId);
        } else if (uploadState?.status === 'failed') {
          newlyFailedUploads.push(upload);
          announcedUploadIdsRef.current.add(upload.uploadId);
        }
      }
    });

    // Build one announcement covering all outcomes.
    const announcementParts = [];
    if (newlyCompletedUploads.length > 0) {
      announcementParts.push(t('uploadSucceededAnnouncement', { count: newlyCompletedUploads.length, fileName: newlyCompletedUploads[0].name }));
    }

    if (newlyFailedUploads.length > 0) {
      announcementParts.push(t('uploadFailedAnnouncement', { count: newlyFailedUploads.length, fileName: newlyFailedUploads[0].name }));
    }

    if (announcementParts.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnnouncement(announcementParts.join(' '));
    }

    if (newlyCompletedUploads.length > 0) {
      // Remove the newly completed uploads from the upload queue and commit
      // them to the field value.
      const newlyCompletedUploadsLocalIds = new Set(newlyCompletedUploads.map((upload) => upload.localId));
      updateUploads((prevUploads) => prevUploads.filter(
        (prevUpload) => !newlyCompletedUploadsLocalIds.has(prevUpload.localId))
      );

      newlyCompletedUploads.forEach(
        (newlyCompletedUpload) => newlyCompletedUpload.previewUrl
          && URL.revokeObjectURL(newlyCompletedUpload.previewUrl)
      );

      onFieldChange(
        id,
        [
          ...value,
          ...newlyCompletedUploads.map(
            (newlyCompletedUpload) => ({ name: newlyCompletedUpload.name, uploadId: newlyCompletedUpload.uploadId })
          ),
        ]
      );
    }
  }, [id, onFieldChange, t, uploads, uploadStatesByIds, value]);

  useEffect(() => () => uploadsRef.current.forEach((upload) => {
    upload.controller?.abort();
    if (upload.previewUrl) {
      URL.revokeObjectURL(upload.previewUrl);
    }
  }), []);

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

    {files.length === 0
      ? <div className={`${styles.dropzone} ${draggingOver ? styles.draggingOver : ''}`} data-testid={`schema-form-attachment-field-${id}-dropzone`}>
        <CloudUploadIcon aria-hidden="true" className={styles.dropzoneIcon} />

        <p className={styles.dropzoneText}>{t('dropzoneText')}</p>
      </div>
      : <ul className={`${styles.fileList} ${draggingOver ? styles.draggingOver : ''}`} role="list">
        {files.map((file, fileIndex) => {
          const uploadState = uploadStatesByIds[file.uploadId] ?? {};

          return <li className={styles.fileRow} key={file.localId}>
            <span aria-hidden="true" className={styles.fileIcon}>
              {file.previewUrl
                ? <img alt="" className={styles.thumbnail} src={file.previewUrl}/>
                : <AttachmentIcon />}
            </span>

            <span className={styles.fileName}>{file.name}</span>

            {uploadState.status === 'in_progress' && <span className={styles.status}>
              {t('uploadingLabel', { progress: Math.round(uploadState.progress * 100) })}
            </span>}

            {uploadState.status === 'failed' && <span className={`${styles.status} ${styles.statusError}`}>
              {t('uploadErrorLabel')}
            </span>}

            {!readOnly && <button
              aria-label={t('removeButtonLabel', { fileName: file.name })}
              className={styles.removeButton}
              onClick={onClickRemove(fileIndex)}
              ref={(element) => {
                if (element) {
                  removeButtonRefs.current.set(file.localId, element);
                } else {
                  removeButtonRefs.current.delete(file.localId);
                }
              }}
              title={t('removeButtonLabel', { fileName: file.name })}
              type="button"
            >
              <TrashCanIcon aria-hidden="true" />
            </button>}
          </li>;
        })}
      </ul>}

    <p
      className={`${styles.description} ${hasError ? styles.error : ''}`}
      id={`${id}-description`}
    >
      {error?.message || details.description}
    </p>

    {!readOnly && <>
      <input
        accept={getAcceptAttributeForFileTypes(details.allowableFileTypes)}
        className={styles.fileInput}
        data-testid={`schema-form-attachment-field-${id}-file-input`}
        multiple
        onChange={onChangeFileInput}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      <button
        aria-required={details.isRequired}
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
