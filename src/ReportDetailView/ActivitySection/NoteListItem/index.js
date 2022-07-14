import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Collapse from 'react-bootstrap/Collapse';
import PropTypes from 'prop-types';

import { ReactComponent as ArrowDownSimpleIcon } from '../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as NoteIcon } from '../../../common/images/icons/note.svg';
import { ReactComponent as PencilIcon } from '../../../common/images/icons/pencil.svg';
import { ReactComponent as TrashCanIcon } from '../../../common/images/icons/trash-can.svg';

import DateTime from '../../../DateTime';
import ItemActionButton from '../ItemActionButton';

import styles from '../styles.module.scss';

const NoteListItem = ({ cardsExpanded, note, onCollapse, onDelete, onExpand, onSave }) => {
  const textareaRef = useRef();

  const isNew = useMemo(() => !note.id, [note.id]);
  const isNewAndEmpty = useMemo(() => isNew && !note.text, [isNew, note.text]);
  const isOpen = useMemo(() => cardsExpanded.includes(note), [cardsExpanded, note]);

  const title = useMemo(() => {
    if (isNew) {
      return `New note${note.text ? `: ${note.text}` : ''}`;
    }
    return note.text;
  }, [isNew, note.text]);

  const [isEditing, setIsEditing] = useState(isNewAndEmpty);
  const [text, setText] = useState(note.text);

  const onClickTrashCanIcon = useCallback((event) => {
    event.stopPropagation();

    onDelete();
  }, [onDelete]);

  const onClickPencilIcon = useCallback((event) => {
    event.stopPropagation();

    onExpand();
    setIsEditing(!isOpen || !isEditing);
  }, [isEditing, isOpen, onExpand]);

  const onChangeTextArea = useCallback((event) => setText(!event.target.value.trim() ? '' : event.target.value), []);

  const onClickCancelButton = useCallback(() => {
    setText(note.text);
    setIsEditing(false);
  }, [note.text]);

  const onClickSaveButton = useCallback(() => {
    setIsEditing(false);

    const trimmedText = text.trim();
    onSave(trimmedText);
    setText(trimmedText);
  }, [onSave, text]);

  return <li className={isOpen ? styles.openItem : ''}>
    <div className={`${styles.itemRow} ${styles.collapseRow}`} onClick={isOpen ? onCollapse: onExpand}>
      <div className={styles.itemIcon}>
        <NoteIcon />
      </div>

      <div className={styles.itemDetails}>
        <p
          className={styles.itemTitle}
          data-testid={`reportDetailView-activitySection-noteTitle-${note.id || note.text}`}
        >
          {title}
        </p>

        {!!note.updates && <DateTime
          className={styles.itemDate}
          data-testid={`reportDetailView-activitySection-dateTime-${note.id || note.text}`}
          date={note.updates[0].time}
          showElapsed={false}
        />}

        {isNew && <div>
          <ItemActionButton onClick={onClickTrashCanIcon} tooltip="Delete">
            <TrashCanIcon data-testid={`reportDetailView-activitySection-deleteIcon-${note.id || note.text}`} />
          </ItemActionButton>
        </div>}
      </div>

      <div className={styles.itemActionButtonContainer}>
        <ItemActionButton onClick={onClickPencilIcon} tooltip="Edit">
          <PencilIcon
            className={isNewAndEmpty ? styles.disabled : ''}
            data-testid={`reportDetailView-activitySection-editIcon-${note.id || note.text}`}
          />
        </ItemActionButton>
      </div>

      <div className={styles.itemActionButtonContainer}>
        <ItemActionButton>
          {isOpen
            ? <ArrowUpSimpleIcon />
            : <ArrowDownSimpleIcon />}
        </ItemActionButton>
      </div>
    </div>

    <Collapse
      className={styles.collapse}
      data-testid={`reportDetailView-activitySection-collapse-${note.id || note.text}`}
      in={isOpen}
    >
      <div>
        <textarea
          className={styles.noteTextArea}
          data-testid={`reportDetailView-activitySection-noteTextArea-${note.id || note.text}`}
          onChange={onChangeTextArea}
          readOnly={!isEditing}
          ref={textareaRef}
          value={text}
        />

        {isEditing && <div className={styles.editingNoteActions}>
          <Button
            disabled={isNewAndEmpty}
            className={styles.cancelNoteButton}
            onClick={onClickCancelButton}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>

          <Button disabled={!text || text === note.text} onClick={onClickSaveButton} type="button">
            Save Note
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
  onCollapse: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onExpand: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default memo(NoteListItem);
