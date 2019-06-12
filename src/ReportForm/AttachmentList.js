import React, { memo } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const AttachmentList = (props) => {
  const { files, notes, onDeleteFile, onDeleteNote, onClickFile, onClickNote } = props;
  const hasItems = !!(files.length || notes.length);

  return hasItems &&
    <ul className={styles.attachmentList}>
      {files.map(file =>
        <li key={file.id || file.name}>
          <a href="#" onClick={() => onClickFile(file)}>{file.name || file.filename}</a>
          <button type="button" onClick={() => onDeleteFile(file)} className={styles.x}>X</button>
        </li>
      )}
      {notes.map(note =>
        <li key={note.id || note.text}>
          <a className={styles.ellipseText} href="#" onClick={() => onClickNote(note)}>{note.text}</a>
          <button type="button" onClick={() => onDeleteNote(note)} className={styles.x}>X</button>
        </li>
      )}
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

export default AttachmentList;