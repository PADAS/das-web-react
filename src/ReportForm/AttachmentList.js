import React, { memo } from 'react';
import PropTypes from 'prop-types';
import DateTime from '../DateTime';

import { ReactComponent as AttachmentIcon } from '../common/images/icons/attachment.svg';
import { ReactComponent as NoteIcon } from '../common/images/icons/note.svg';
import { ReactComponent as ClearIcon } from '../common/images/icons/close-icon.svg';

import styles from './styles.module.scss';


const AttachmentList = (props) => {
  const { files, notes, onDeleteFile, onDeleteNote, onClickFile, onClickNote } = props;
  const hasItems = !!(files.length || notes.length);

  const generateListItemForNote = (note) => {
    const key = note.id || note.text;
    const noteIsNew = !note.id;

    return <li key={key}>
      <div className={styles.attachmentIcon}><NoteIcon /></div>
      <div className={styles.attachmentInfo}>
        <button type="button" className={styles.ellipseText} href="#" onClick={() => onClickNote(note)}>{note.text}</button>
        {!noteIsNew && <div className={styles.attachmentUser}>{`${note.updates[0].user.first_name} ${note.updates[0].user.last_name}`.trim()}</div>}
      </div>
      {!noteIsNew && <DateTime className={styles.attachmentDate} date={note.updates[0].time}/>}
      {noteIsNew && <ClearIcon onClick={() => onDeleteNote(note)} className={styles.x} />}
    </li>;

  };

  const generateListItemForFile = (file) => {
    const key = file.id || file.name;
    const fileIsNew = !file.id;

    return <li key={key}>
      <div className={styles.attachmentIcon}><AttachmentIcon /></div>
      <div className={styles.attachmentInfo}>
        <button type="button" onClick={() => file.id ? onClickFile(file) : null}>{file.filename || file.name}</button>
        {!fileIsNew && <div className={styles.attachmentUser}>{`${file.updates[0].user.first_name} ${file.updates[0].user.last_name}`.trim()}</div>}
      </div>
      {!fileIsNew && <DateTime className={styles.attachmentDate} date={file.updates[0].time}/>}
      {fileIsNew && <ClearIcon onClick={() => onDeleteFile(file)} className={styles.x} />}
    </li>;
  };

  return hasItems &&
    <ul className={styles.attachmentList}>
      {files.map(generateListItemForFile)}
      {notes.map(generateListItemForNote)}
    </ul>;
};

AttachmentList.propTypes = {
  files: PropTypes.array.isRequired,
  notes: PropTypes.array.isRequired,
  onClickFile: PropTypes.func.isRequired,
  onClickNote: PropTypes.func.isRequired,
  onDeleteFile: PropTypes.func.isRequired,
  onDeleteNote: PropTypes.func.isRequired,
};

export default memo(AttachmentList);