import React, { memo, useCallback, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { convertFileListToArray, filterDuplicateUploadFilenames } from '../../utils/file';

import { ReactComponent as AttachmentIcon } from '../../common/images/icons/attachment.svg';

import styles from './styles.module.scss';

const ATTACHMENT_FILE_TYPES_ACCEPTED = [
  'image/*',
  '.doc',
  '.docx',
  '.xml',
  '.xlsx',
  '.csv',
  '.pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const AddAttachmentButton = ({
  attachmentsToAdd,
  className,
  reportAttachments,
  reportTracker,
  setAttachmentsToAdd,
}) => {
  const fileInputRef = useRef();

  const [draggingOver, setDraggingOver] = useState(false);

  const attachFiles = useCallback((files) => {
    const filesArray = convertFileListToArray(files);
    const uploadableFiles = filterDuplicateUploadFilenames([...reportAttachments, ...attachmentsToAdd], filesArray);
    setAttachmentsToAdd([...attachmentsToAdd, ...uploadableFiles]);

    reportTracker.track('Added Attachment');
  }, [attachmentsToAdd, reportAttachments, reportTracker, setAttachmentsToAdd]);

  const onClick = useCallback((event) => {
    event.preventDefault();

    fileInputRef.current.click();
  }, []);

  const onDragLeave = useCallback((event) => {
    event.preventDefault();

    setDraggingOver(false);
    return false;
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();

    setDraggingOver(true);
    return false;
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();

    setDraggingOver(false);
    attachFiles(event.dataTransfer.files);
  }, [attachFiles]);

  const onAttachFileFromDialog = useCallback((event) => {
    event.preventDefault();

    attachFiles(fileInputRef.current.files);
  }, [attachFiles]);

  return <>
    <input
      accept={ATTACHMENT_FILE_TYPES_ACCEPTED.join(', ')}
      data-testid="reportDetailView-addAttachmentButton"
      multiple
      onChange={onAttachFileFromDialog}
      ref={fileInputRef}
      style={{ display: 'none' }}
      type="file"
    />

    <Button
      className={`${className} ${draggingOver ? styles.draggingOver : ''} `}
      onClick={onClick}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      type="button"
      variant="secondary"
      >
      <AttachmentIcon />
      <label>Attachment</label>
    </Button>
  </>;
};

AddAttachmentButton.defaultProps = {
  className: '',
};

AddAttachmentButton.propTypes = {
  attachmentsToAdd: PropTypes.arrayOf(PropTypes.object).isRequired,
  className: PropTypes.string,
  reportAttachments: PropTypes.arrayOf(PropTypes.object).isRequired,
  reportTracker: PropTypes.shape({
    track: PropTypes.func,
  }).isRequired,
  setAttachmentsToAdd: PropTypes.func.isRequired,
};

export default memo(AddAttachmentButton);
