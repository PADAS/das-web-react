import React, { memo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const AttachmentControls = memo((props) => {
  const { onFilesAdded, onNoteAdded, onClickAddReport } = props;

  const [draggingFiles, setFileDragState] = useState(false);
  const fileInputRef = useRef(null);

  const onFileDragOver = () => {
    setFileDragState(true);
  };

  const onFileDragLeave = () => {
    setFileDragState(false);
  };

  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  const onFileDrop = (event) => {
    event.preventDefault();
    // const { dataTransfer: { files }, preventDefault } = event;
    onFilesAdded(event);
  };

  const startAddNote = () => {
    console.log('ima add a note dawg');
  };

  return (
    <div className={styles.attachmentControls}>
      <input ref={fileInputRef} type="file" className={styles.fileUpload} style={{ display: none }} onChange={onFilesAdded}></input>

      <button onClick={openFileDialog} onDrop={onFileDrop} className={draggingFiles ? styles.draggingOver : ''} onDragOver={onFileDragOver} onDragLeave={onFileDragLeave}>
        Add Attachment(s)
      </button>

      <button className={styles.addNoteBtn} onClick={startAddNote}>
        Add Note
      </button>

      <button className={styles.addReportBtn} onClick={onClickAddReport}>
        Add Report
      </button>

    </div>
  )
});

export default AttachmentControls;

AttachmentControls.defaultProps = {
  onFilesAdded(event) {
    console.log('files added', event);
  },
  onNoteAdded(note) {
    console.log('note added', note);
  },
  onClickAddReport(event) {
    console.log('start to add a report eh', event);
  },
};

AttachmentControls.propTypes = {
  onFilesAdded: PropTypes.func,
  onNoteAdded: PropTypes.func,
  onClickAddReport: PropTypes.func,
}