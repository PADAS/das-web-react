import React, { forwardRef, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Collapse from 'react-bootstrap/Collapse';
import PropTypes from 'prop-types';

import { ReactComponent as ArrowDownSimpleIcon } from '../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as NoteIcon } from '../../../common/images/icons/note.svg';
import { ReactComponent as PencilIcon } from '../../../common/images/icons/pencil.svg';
import { ReactComponent as TrashCanIcon } from '../../../common/images/icons/trash-can.svg';

import { TrackerContext } from '../../../utils/analytics';

import DateTime from '../../../DateTime';
import ItemActionButton from '../ItemActionButton';

import styles from '../styles.module.scss';

const NoteListItem = ({
  cardsExpanded,
  note,
  onBlur,
  onCancel,
  onCollapse,
  onDelete,
  onExpand,
  onSave,
}, ref = null) => {
  const textareaRef = useRef();

  const tracker = useContext(TrackerContext);

  const isNew = useMemo(() => !note.id, [note.id]);
  const isNewAndUnAdded = useMemo(() => isNew && !note.text, [isNew, note.text]);
  const isOpen = useMemo(() => cardsExpanded.includes(note), [cardsExpanded, note]);

  const title = useMemo(() => {
    if (isNew) {
      return `New note${note.text ? `: ${note.text}` : ''}`;
    }
    return note.text;
  }, [isNew, note.text]);

  const [isEditing, setIsEditing] = useState(isNewAndUnAdded);
  const [text, setText] = useState(note.text);

  const onClickTrashCanIcon = useCallback((event) => {
    event.stopPropagation();

    tracker.track(`Delete ${isNew ? 'new' : 'existing'} note`);

    onDelete();
  }, [tracker, onDelete, isNew]);

  const onClickPencilIcon = useCallback((event) => {
    const newEditState = !isOpen || !isEditing;

    event.stopPropagation();

    onExpand();

    tracker.track(`${newEditState ? 'Start' : 'Stop'} editing ${isNew ? 'new' : 'existing'} note`);

    setIsEditing(newEditState);
  }, [tracker, isEditing, isNew, isOpen, onExpand]);

  const onBlurTextArea = useCallback((event) => note.text !== text && onBlur(note, event.target.value), [note, onBlur, text]);

  const onChangeTextArea = useCallback((event) => setText(!event.target.value.trim() ? '' : event.target.value), []);

  const onClickCancelButton = useCallback(() => {
    if (isNewAndUnAdded) {
      tracker.track('Cancel writing new note');

      onDelete();
    } else {
      tracker.track('Cancel editing existing note');

      setText(note.text);
      onCancel(note);
    }
    setIsEditing(false);
  }, [isNewAndUnAdded, tracker, onDelete, note, onCancel]);

  const onClickSaveButton = useCallback(() => {
    setIsEditing(false);
    const trimmedText = text.trim();

    const newNote = {
      ...note,
      text: trimmedText,
    };

    tracker.track(`Save ${isNew ? 'new' : 'existing'} note`);

    onSave(newNote);
    setText(trimmedText);
  }, [isNew, note, onSave, tracker, text]);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = textareaRef.current.value.length;
        }
      });
    }
  }, [isEditing]);

  return <li className={isOpen ? styles.openItem : ''} ref={ref}>
    <div className={`${styles.itemRow} ${styles.collapseRow}`} onClick={isOpen ? onCollapse: onExpand}>
      <div className={styles.itemIcon}>
        <NoteIcon />
      </div>

      <div className={styles.itemDetails}>
        <p
          className={styles.itemTitle}
          data-testid={`activitySection-noteTitle-${note.id || note.text}`}
        >
          {title}
        </p>

        {!!note.updates && <DateTime
          className={styles.itemDate}
          data-testid={`activitySection-dateTime-${note.id || note.text}`}
          date={note.updates[0].time}
          showElapsed={false}
        />}

        {isNew && <div>
          <ItemActionButton onClick={onClickTrashCanIcon} tooltip="Delete">
            <TrashCanIcon data-testid={`activitySection-deleteIcon-${note.id || note.text}`} />
          </ItemActionButton>
        </div>}
      </div>

      <div className={styles.itemActionButtonContainer}>
        <ItemActionButton onClick={onClickPencilIcon} tooltip="Edit">
          <PencilIcon
            className={isNewAndUnAdded ? styles.disabled : ''}
            data-testid={`activitySection-editIcon-${note.id || note.text}`}
          />
        </ItemActionButton>
      </div>

      <div className={styles.itemActionButtonContainer}>
        <ItemActionButton>
          {isOpen
            ? <ArrowUpSimpleIcon data-testid={`activitySection-arrowUp-${note.id || note.text}`} />
            : <ArrowDownSimpleIcon data-testid={`activitySection-arrowDown-${note.id || note.text}`} />}
        </ItemActionButton>
      </div>
    </div>

    <Collapse
      className={styles.collapse}
      data-testid={`activitySection-collapse-${note.id || note.text}`}
      in={isOpen}
    >
      <div>
        <textarea
          className={styles.noteTextArea}
          data-testid={`activitySection-noteTextArea-${note.id || note.text}`}
          onBlur={onBlurTextArea}
          onChange={onChangeTextArea}
          readOnly={!isEditing}
          ref={textareaRef}
          value={text}
        />

        {isEditing && <div className={styles.editingNoteActions}>
          <Button
            className={styles.cancelNoteButton}
            onClick={onClickCancelButton}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>

          <Button disabled={!text || text === note.text} onClick={onClickSaveButton} type="button" data-testid='note_done' >
            Done
          </Button>
        </div>}
      </div>
    </Collapse>
  </li>;
};

NoteListItem.defaultProps = {
  onDelete: null,
};

NoteListItem.propTypes = {
  cardsExpanded: PropTypes.array.isRequired,
  note: PropTypes.PropTypes.shape({
    id: PropTypes.string,
    text: PropTypes.string,
    updates: PropTypes.arrayOf(PropTypes.shape({
      time: PropTypes.string,
    })),
  }).isRequired,
  onBlur: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onCollapse: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onExpand: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default memo(forwardRef(NoteListItem));