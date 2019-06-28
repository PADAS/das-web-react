import React, { memo, useRef, useState, Fragment } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { convertFileListToArray } from '../utils/file';
import { addModal } from '../ducks/modals';

import NoteModal from '../NoteModal';
import AddReport from '../AddReport';

import { ReactComponent as AttachmentIcon } from '../common/images/icons/attachment.svg';
import { ReactComponent as NoteIcon } from '../common/images/icons/note.svg';
import { ReactComponent as FieldReportIcon } from '../common/images/icons/go_to_incident.svg';

import styles from './styles.module.scss';

const AttachmentButton = ({ title, icon: Icon, ...rest }) => <button title={title} type='button' {...rest}>
  <Icon />
  <span>{title}</span>
</button>;

const AttachmentControls = (props) => {
  const { addModal, relationshipButtonDisabled, allowMultipleFiles, map, onAddFiles,
    onSaveNote, onNewReportSaved, isCollectionChild, onGoToCollection } = props;

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
    <div className={styles.attachmentControls} ref={attachmentControlsRef}>
      <input
        accept='image/*, .doc, .docx, .xml, .xlsx, .csv, .pdf, text/plain, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ref={fileInputRef} type='file'
        multiple={allowMultipleFiles}
        className={styles.fileUpload}
        onChange={onFileAddFromDialog}>
      </input>

      <AttachmentButton title='Add Attachment' icon={AttachmentIcon}
        onClick={openFileDialog} onDrop={onFileDrop} className={`${styles.draggable} ${draggingFiles ? styles.draggingOver : ''}`} onDragOver={onFileDragOver} onDragLeave={onFileDragLeave}
      />

      <AttachmentButton title='Add Note' icon={NoteIcon} className={styles.addNoteBtn} onClick={startAddNote} />

      {!relationshipButtonDisabled && <Fragment>
        {!isCollectionChild && <AddReport map={map} container={attachmentControlsRef} relationshipButtonDisabled={true} onSaveSuccess={onNewReportSaved} />}
        {isCollectionChild && <AttachmentButton icon={FieldReportIcon} title='Go To Collection' onClick={onGoToCollection} />}

      </Fragment>}

    </div>
  );
};

export default connect(null, { addModal })(memo(AttachmentControls));

AttachmentControls.defaultProps = {
  relationshipButtonDisabled: false,
  allowMultipleFiles: true,
  isCollectionChild: false,
  onGoToCollection() {

  },
};

AttachmentControls.propTypes = {
  isCollection: PropTypes.bool,
  onGoToCollection: PropTypes.func,
  relationshipButtonDisabled: PropTypes.bool,
  allowMultipleFiles: PropTypes.bool,
  map: PropTypes.object.isRequired,
  onAddFiles: PropTypes.func.isRequired,
  onSaveNote: PropTypes.func.isRequired,
  onNewReportSaved: PropTypes.func.isRequired,
};