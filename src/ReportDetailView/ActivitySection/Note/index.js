import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Collapse from 'react-bootstrap/Collapse';
import PropTypes from 'prop-types';

import { ReactComponent as ArrowDownSmallIcon } from '../../../common/images/icons/arrow-down-small.svg';
import { ReactComponent as ArrowUpSmallIcon } from '../../../common/images/icons/arrow-up-small.svg';
import { ReactComponent as PencilIcon } from '../../../common/images/icons/pencil.svg';
import { ReactComponent as NoteIcon } from '../../../common/images/icons/note.svg';
import { ReactComponent as TrashCanIcon } from '../../../common/images/icons/trash-can.svg';

import DateTime from '../../../DateTime';

import styles from '../styles.module.scss';

const Note = ({
  cardsExpanded,
  note,
  notesToAdd,
  reportNotes,
  setCardsExpanded,
  setNotesToAdd,
  setReportNotes,
}) => {
  const textareaRef = useRef();

  const isNew = useMemo(() => !note.id, [note.id]);
  const isOpen = useMemo(() => cardsExpanded.includes(note), [cardsExpanded, note]);

  const [isEditing, setIsEditing] = useState(isNew && !note.text);
  const [text, setText] = useState(note.text);

  const setIsOpen = useCallback((newIsOpen) => {
    if (newIsOpen && !isOpen) {
      setCardsExpanded([...cardsExpanded, note]);
    } else if (!newIsOpen && isOpen) {
      setCardsExpanded(cardsExpanded.filter((cardExpanded) => cardExpanded !== note));
    }
  }, [cardsExpanded, isOpen, note, setCardsExpanded]);

  const onCancel = useCallback(() => {
    setIsEditing(false);
    setText(note.text);
  }, [note.text]);

  const onDelete = () => setNotesToAdd(notesToAdd.filter((noteToAdd) => noteToAdd !== note));

  const onEdit = useCallback(() => {
    setIsOpen(true);
    setIsEditing(true);
  }, [setIsOpen]);

  const onSave = useCallback(() => {
    const noteToSave = { ...note, text };

    if (isNew) {
      setNotesToAdd(notesToAdd.map((noteToAdd) => noteToAdd === note ? noteToSave : noteToAdd));
    } else {
      setReportNotes(reportNotes.map((reportNote) => reportNote === note ? noteToSave : reportNote));
    }

    setIsEditing(false);
    setCardsExpanded([...cardsExpanded.filter((cardExpanded) => cardExpanded !== note), noteToSave]);
  }, [cardsExpanded, isNew, note, notesToAdd, reportNotes, setCardsExpanded, setNotesToAdd, setReportNotes, text]);

  useEffect(() => {
    if (textareaRef.current && ((isNew && !note.text) || isEditing)) {
      textareaRef.current.focus();
    }
  }, [isEditing, isNew, note.text, textareaRef]);

  return <li>
    <div className={styles.itemRow}>
      <div className={styles.itemIcon}>
        <NoteIcon />
      </div>

      <div className={styles.itemDetails}>
        <p className={styles.itemTitle}>{isNew ? `(New note) ${note.text}` : note.text}</p>

        {!!note.updates && <DateTime
          className={styles.itemDate}
          date={note.updates[0].time}
          showElapsed={false}
        />}
      </div>

      {isNew
        ? <div className={styles.itemActionButton}>
          <TrashCanIcon onClick={onDelete} />
        </div>
        : <div className={styles.itemActionButton} />}

      <div className={styles.itemActionButton}>
        <PencilIcon onClick={onEdit} />
      </div>

      <div className={styles.itemActionButton}>
        {isOpen
          ? <ArrowUpSmallIcon onClick={() => setIsOpen(false)} />
          : <ArrowDownSmallIcon onClick={() => setIsOpen(true)} />}
      </div>
    </div>

    <Collapse in={isOpen}>
      <div>
        <textarea
          className={styles.noteTextArea}
          onChange={(event) => setText(event.target.value)}
          readOnly={!isEditing}
          ref={textareaRef}
          value={text}
        />

        {isEditing && <div className={styles.editingNoteActions}>
          <Button className={styles.cancelNoteButton} onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>

          <Button onClick={onSave} type="button">
            Save Note
          </Button>
        </div>}
      </div>
    </Collapse>
  </li>;
};

Note.defaultProps = {
  notesToAdd: [],
  reportNotes: [],
  setNotesToAdd: null,
  setReportNotes: null,
};

Note.propTypes = {
  cardsExpanded: PropTypes.array.isRequired,
  note: PropTypes.PropTypes.shape({
    id: PropTypes.string,
    text: PropTypes.string,
    updates: PropTypes.arrayOf(PropTypes.shape({
      time: PropTypes.string,
    })),
  }).isRequired,
  notesToAdd: PropTypes.arrayOf(PropTypes.object),
  reportNotes: PropTypes.arrayOf(PropTypes.object),
  setCardsExpanded: PropTypes.func.isRequired,
  setNotesToAdd: PropTypes.func,
  setReportNotes: PropTypes.func,
};

export default memo(Note);
