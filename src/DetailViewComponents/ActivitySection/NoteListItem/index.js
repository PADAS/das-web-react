import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSimpleIcon } from '../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as NoteIcon } from '../../../common/images/icons/note.svg';
import { ReactComponent as PencilIcon } from '../../../common/images/icons/pencil.svg';
import { ReactComponent as TrashCanIcon } from '../../../common/images/icons/trash-can.svg';

import { format, STANDARD_DATE_FORMAT } from '../../../utils/datetime';
import { TrackerContext } from '../../../utils/analytics';

import * as activitySectionStyles from '../styles.module.scss';
import * as styles from './styles.module.scss';

const EXISTING_NOTE_ANALYTICS_LABEL = 'existing note';
const NEW_NOTE_ANALYTICS_LABEL = 'new note';

const CARD_EXPANSION_TRANSITION_TIME = parseFloat(activitySectionStyles.cardToggleTransitionTime);

const NoteListItem = ({
  isOpen = false,
  note,
  onCancel,
  onChange,
  onCollapse,
  onDelete = null,
  onDone,
  onExpand,
  ref,
}) => {
  const { t } = useTranslation('details-view', { keyPrefix: 'noteListItem' });

  const tracker = useContext(TrackerContext);

  const textareaRef = useRef(null);
  const wasOpenRef = useRef(isOpen);

  const isNew = !note.id;

  const [isEditing, setIsEditing] = useState(isNew);

  const analyticsLabel = isNew ? NEW_NOTE_ANALYTICS_LABEL : EXISTING_NOTE_ANALYTICS_LABEL;

  const isUnsavedNewNote = !!note.tmpId && !note.originalText && !!onDelete;

  const noteText = note.text ?? '';
  const trimmedText = noteText.trim();

  const updateDate = note.updates?.[0]?.time ? new Date(note.updates[0].time) : null;

  const showDeleteButton = isNew && !!onDelete;

  const onToggleCollapseRow = () => (isOpen ? onCollapse : onExpand)(note, analyticsLabel);

  const onClickCollapseToggleButton = (event) => {
    event.preventDefault();
    event.stopPropagation();

    onToggleCollapseRow();
  };

  const onClickDeleteButton = (event) => {
    event.stopPropagation();

    onDelete(note);

    tracker.track(`Delete ${analyticsLabel}`);
  };

  const onClickEditButton = (event) => {
    event.stopPropagation();

    if (!isOpen) {
      onExpand(note, analyticsLabel);
    }
    setIsEditing(true);

    tracker.track(`Start editing ${analyticsLabel}`);
  };

  const onDiscardEdition = useCallback(() => {
    onCancel(note);
    setIsEditing(false);

    tracker.track(`Cancel editing ${analyticsLabel}`);
  }, [analyticsLabel, note, onCancel, tracker]);

  const onClickCancelButton = () => {
    if (isUnsavedNewNote) {
      onDelete(note);
      setIsEditing(false);

      tracker.track('Cancel writing new note');
    } else {
      onDiscardEdition();
    }
  };

  const onClickDoneButton = () => {
    onDone(note);
    setIsEditing(false);

    tracker.track(`Save ${analyticsLabel}`);
  };

  useEffect(() => {
    const isCollapsing = wasOpenRef.current && !isOpen;
    wasOpenRef.current = isOpen;

    if (isCollapsing && isEditing) {
      onDiscardEdition();
    }
  }, [isEditing, isOpen, onDiscardEdition]);

  useEffect(() => {
    if (isEditing && isOpen) {
      const timeoutId = setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
      }, CARD_EXPANSION_TRANSITION_TIME);

      return () => clearTimeout(timeoutId);
    }
  }, [isEditing, isOpen]);

  return <li className={activitySectionStyles.listItem} ref={ref}>
    <div
      className={`${activitySectionStyles.itemRow} ${isUnsavedNewNote ? '' : activitySectionStyles.collapseRow}`}
      onClick={isUnsavedNewNote ? undefined : onToggleCollapseRow}
    >
      <div className={`${activitySectionStyles.itemIcon} ${styles.smallItemIcon}`}>
        <NoteIcon aria-hidden="true" data-testid="note-icon" />
      </div>

      <div className={`${activitySectionStyles.itemDetails} ${showDeleteButton ? styles.deletableNoteDetails : ''}`}>
        <p
          className={activitySectionStyles.itemTitle}
          data-testid={`activitySection-noteTitle-${note.id || noteText}`}
        >
          {isNew ? t('noteTitle', { noteText }) : noteText}
        </p>

        {updateDate && <time
          className={activitySectionStyles.itemDate}
          data-testid={`activitySection-dateTime-${note.id || noteText}`}
          dateTime={updateDate.toISOString()}
        >
          {format(updateDate, STANDARD_DATE_FORMAT)}
        </time>}

        {showDeleteButton && <button
          aria-label={t('deleteNoteButtonTooltip')}
          className={activitySectionStyles.actionButton}
          onClick={onClickDeleteButton}
          title={t('deleteNoteButtonTooltip')}
          type="button"
        >
          <TrashCanIcon aria-hidden="true" data-testid={`activitySection-deleteIcon-${note.id || noteText}`} />
        </button>}
      </div>

      <div className={activitySectionStyles.itemActionButtonContainer}>
        <button
          aria-label={t('editNoteButtonTooltip')}
          className={activitySectionStyles.actionButton}
          disabled={isOpen && isEditing}
          onClick={onClickEditButton}
          title={t('editNoteButtonTooltip')}
          type="button"
        >
          <PencilIcon aria-hidden="true" data-testid={`activitySection-editIcon-${note.id || noteText}`} />
        </button>
      </div>

      <div className={activitySectionStyles.itemActionButtonContainer}>
        <button
          aria-expanded={isOpen}
          aria-label={t(isOpen ? 'collapseOpenButtonLabel' : 'collapseClosedButtonLabel')}
          className={`${activitySectionStyles.actionButton} ${activitySectionStyles.collapseToggleButton}`}
          disabled={isUnsavedNewNote}
          onClick={onClickCollapseToggleButton}
          title={t(isOpen ? 'collapseOpenButtonLabel' : 'collapseClosedButtonLabel')}
          type="button"
        >
          {isOpen
            ? <ArrowUpSimpleIcon aria-hidden="true" data-testid={`activitySection-arrowUp-${note.id || noteText}`} />
            : <ArrowDownSimpleIcon
              aria-hidden="true"
              data-testid={`activitySection-arrowDown-${note.id || noteText}`}
            />}
        </button>
      </div>
    </div>

    <Collapse
      className={activitySectionStyles.collapse}
      data-testid={`activitySection-collapse-${note.id || noteText}`}
      in={isOpen}
    >
      <div>
        <div inert={!isOpen}>
          <textarea
            aria-label={t('noteTextAreaLabel')}
            className={styles.noteTextArea}
            data-testid={`activitySection-noteTextArea-${note.id || noteText}`}
            onChange={(event) => onChange(note, event)}
            readOnly={!isEditing}
            ref={textareaRef}
            value={noteText}
          />

          <div className={styles.printableNoteText}>{noteText}</div>

          {isEditing && <div className={styles.editingNoteActions}>
            <button
              className={styles.cancelNoteButton}
              data-testid={`activitySection-noteCancel-${note.id || noteText}`}
              onClick={onClickCancelButton}
              type="button"
            >
              {t('cancelEditingNoteButton')}
            </button>

            <button
              className={styles.doneNoteButton}
              data-testid={`activitySection-noteDone-${note.id || noteText}`}
              disabled={!trimmedText || note.originalText === trimmedText}
              onClick={onClickDoneButton}
              type="button"
            >
              {t('doneEditingNoteButton')}
            </button>
          </div>}
        </div>
      </div>
    </Collapse>
  </li>;
};

export default memo(NoteListItem);
