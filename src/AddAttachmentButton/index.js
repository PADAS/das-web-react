import React, { memo, useCallback, useContext, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { TrackerContext } from '../utils/analytics';

import { ReactComponent as AttachmentIcon } from '../common/images/icons/attachment.svg';

import styles from './styles.module.scss';

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
];

const AddAttachmentButton = ({ className, onAddAttachments }) => {
  const fileInputRef = useRef();

  const analytics = useContext(TrackerContext);

  const [draggingOver, setDraggingOver] = useState(false);

  const addAttachments = useCallback((files) => {
    onAddAttachments(files);
    fileInputRef.current.value = null;
  }, [onAddAttachments]);

  const onAttachmentButtonClick = useCallback((event) => {
    event.preventDefault();

    analytics?.track('Start adding attachment');

    fileInputRef?.current?.click();
  }, []);

  const onAttachmentButtonDragLeave = useCallback((event) => {
    event.preventDefault();

    setDraggingOver(false);
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
    addAttachments(event.dataTransfer.files);
  }, [analytics, addAttachments]);

  const onChangeFileInput = useCallback((event) => {
    event.preventDefault();

    analytics?.track('Add attachment');

    addAttachments(fileInputRef.current.files);
  }, [analytics, addAttachments]);

  return <>
    <input
      accept={ATTACHMENT_FILE_TYPES_ACCEPTED.join(', ')}
      data-testid="addAttachmentButton"
      multiple
      onChange={onChangeFileInput}
      ref={fileInputRef}
      style={{ display: 'none' }}
      type="file"
    />

    <Button
      className={`${className} ${draggingOver ? styles.draggingOver : ''} `}
      onClick={onAttachmentButtonClick}
      onDragLeave={onAttachmentButtonDragLeave}
      onDragOver={onAttachmentButtonDragOver}
      onDrop={onAttachmentButtonDrop}
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
