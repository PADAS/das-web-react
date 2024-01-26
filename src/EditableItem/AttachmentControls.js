import React, { memo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';


import { convertFileListToArray } from '../utils/file';
import { addModal } from '../ducks/modals';

import { analyticsMetadataProps } from '../proptypes';

import NoteModal from '../NoteModal';

import { trackEvent } from '../utils/analytics';

import { ReactComponent as AttachmentIcon } from '../common/images/icons/attachment.svg';
import { ReactComponent as NoteIcon } from '../common/images/icons/note.svg';

import styles from './styles.module.scss';

const AttachmentButton = memo(({ title, icon: Icon, ...rest }) => <button title={title} type='button' {...rest}>  {/* eslint-disable-line react/display-name */}
  <Icon />
  <span>{title}</span>
</button>);

const AttachmentControls = ({
  addModal,
  analyticsMetadata,
  children,
  allowMultipleFiles,
  onAddFiles,
  onSaveNote
}) => {
  const { t } = useTranslation('details-view', { keyPrefix: 'attachmentControls' });
  const hasAnalytics = !!analyticsMetadata;
  const [draggingFiles, setFileDragState] = useState(false);
  const fileInputRef = useRef(null);
  const attachmentControlsRef = useRef(null);

  const onFileDragOver = (e) => {
    e.preventDefault();
    setFileDragState(true);
    return false;
  };

  const onFileDragLeave = (e) => {
    e.preventDefault();
    setFileDragState(false);
    return false;
  };

  const openFileDialog = (e) => {
    e.preventDefault();
    fileInputRef.current.click();
    hasAnalytics && trackEvent(`${analyticsMetadata.category}`, `Click 'Add Attachment' button${analyticsMetadata.location ? ` for ${analyticsMetadata.location}` : ''}`);
  };

  const onFileDrop = (event) => {
    hasAnalytics && trackEvent(`${analyticsMetadata.category}`, `Drag and drop attachment${analyticsMetadata.location ? ` for ${analyticsMetadata.location}` : ''}`);

    event.preventDefault();
    const { dataTransfer: { files } } = event;

    setFileDragState(false);

    onAddFiles(convertFileListToArray(files));
  };

  const onFileAddFromDialog = (event) => {
    event.preventDefault();

    const { files } = fileInputRef.current;
    onAddFiles(convertFileListToArray(files));
  };

  const startAddNote = () => {
    hasAnalytics && trackEvent(`${analyticsMetadata.category}`, `Click 'Add Note' button${analyticsMetadata.location ? ` for ${analyticsMetadata.location}` : ''}`);
    addModal({
      content: NoteModal,
      note: {
        text: '',
      },
      onSubmit: onSaveNote,
    });
  };

  return (
    <div className={styles.attachmentControls} ref={attachmentControlsRef}>
      <input
        style={{ display: 'none' }}
        accept='image/*, .doc, .docx, .xml, .xlsx, .csv, .pdf, text/plain, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ref={fileInputRef} type='file'
        multiple={allowMultipleFiles}
        onChange={onFileAddFromDialog}>
      </input>

      <AttachmentButton title={t('addNoteTitle')} icon={NoteIcon} onClick={startAddNote} />

      <AttachmentButton title={t('addAttachmentTitle')} icon={AttachmentIcon}
        onClick={openFileDialog} onDrop={onFileDrop} className={`${styles.draggable} ${draggingFiles ? styles.draggingOver : ''}`} onDragOver={onFileDragOver} onDragLeave={onFileDragLeave} />

      {children}
    </div>
  );
};

export default connect(null, { addModal })(memo(AttachmentControls));

export { AttachmentButton };

AttachmentControls.defaultProps = {
  allowMultipleFiles: true,
};

AttachmentControls.propTypes = {
  analyticsMetadata: analyticsMetadataProps,
  allowMultipleFiles: PropTypes.bool,
  onAddFiles: PropTypes.func.isRequired,
  onSaveNote: PropTypes.func.isRequired,
};
