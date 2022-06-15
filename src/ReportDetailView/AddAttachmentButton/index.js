import React, { memo, useCallback, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

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

const AddAttachmentButton = ({ className, onAddAttachments }) => {
  const fileInputRef = useRef();

  const [draggingOver, setDraggingOver] = useState(false);

  const attachFiles = useCallback((files) => onAddAttachments(files), [onAddAttachments]);

  const onButtonClick = useCallback((event) => {
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
      onClick={onButtonClick}
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
  className: PropTypes.string,
  onAddAttachments: PropTypes.func.isRequired,
};

export default memo(AddAttachmentButton);
