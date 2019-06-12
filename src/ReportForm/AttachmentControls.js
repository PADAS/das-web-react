import React, { memo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { convertFileListToArray } from '../utils/file';
import { addModal } from '../ducks/modals';

import NoteModal from '../NoteModal';

import styles from './styles.module.scss';

const AttachmentControls = memo((props) => {
  const { addModal, allowMultipleFiles, onAddFiles, onSaveNote, onClickAddReport } = props;

  const [draggingFiles, setFileDragState] = useState(false);
  const fileInputRef = useRef(null);

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
  };

  const onFileDrop = (event) => {
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
    addModal({
      content: NoteModal,
      note: {
        text: '',
      },
      onSubmit: onSaveNote,
    });
  };

  return (
    <div className={styles.attachmentControls}>
      <input
        accept='image/*, .doc, .docx, .xml, .xlsx, .csv, .pdf, text/plain, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ref={fileInputRef} type='file'
        multiple={allowMultipleFiles}
        className={styles.fileUpload}
        onChange={onFileAddFromDialog}>
      </input>

      <button type="button" onClick={openFileDialog} onDrop={onFileDrop} className={`${styles.draggable} ${draggingFiles ? styles.draggingOver : ''}`} onDragOver={onFileDragOver} onDragLeave={onFileDragLeave}>
        Add Attachment<br />
        (click or drag here)
      </button>

      <button type="button" className={styles.addNoteBtn} onClick={startAddNote}>
        Add Note
      </button>

      <button type="button" className={styles.addReportBtn} onClick={onClickAddReport}>
        Add Report
      </button>

    </div>
  )
});



export default connect(null, { addModal })(AttachmentControls);

AttachmentControls.defaultProps = {
  allowMultipleFiles: false,
};

AttachmentControls.propTypes = {
  allowMultipleFiles: PropTypes.bool,
  onAddFiles: PropTypes.func.isRequired,
  onSaveNote: PropTypes.func.isRequired,
  onClickAddReport: PropTypes.func.isRequired,
}