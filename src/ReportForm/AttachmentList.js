import React, { memo } from 'react';
import PropTypes from 'prop-types';
import TimeAgo from 'react-timeago';

import { ReactComponent as AttachmentIcon } from '../common/images/icons/attachment.svg';
import { ReactComponent as NoteIcon } from '../common/images/icons/note.svg';

import styles from './styles.module.scss';


const AttachmentList = (props) => {
  const { files, notes, onDeleteFile, onDeleteNote, onClickFile, onClickNote } = props;
  const hasItems = !!(files.length || notes.length);

  const generateListItemForNote = (note) => {
    const key = note.id || note.text;
    const noteIsNew = !note.id;

    return <li key={key}>
      <NoteIcon />
      <div>
        {!noteIsNew && <h6>
          {note.updates[0].message}
          <TimeAgo date={note.updates[0].time} />
        </h6>}
        <button type="button" className={styles.ellipseText} href="#" onClick={() => onClickNote(note)}>{note.text}</button>
      </div>
      <button type="button" onClick={() => onDeleteNote(note)} className={styles.x}>X</button>
    </li>;

  };

  const generateListItemForFile = (file) => {
    const key = file.id || file.name;
    const fileIsNew = !file.id;

    return <li key={key}>
      <AttachmentIcon />
      <div>
        {!fileIsNew && <h6>
          {file.updates[0].message}
          <TimeAgo date={file.updates[0].time} />
        </h6>}
        <button type="button" onClick={() => file.id ? onClickFile(file) : null}>{file.filename || file.name}</button>
      </div>
      <button type="button" onClick={() => onDeleteFile(file)} className={styles.x}>X</button>
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