import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as ArrowDownIcon } from '../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../../common/images/icons/arrow-up.svg';
import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';

import { ASCENDING_SORT_ORDER, DESCENDING_SORT_ORDER } from '../../constants';

import AttachmentListItem from './AttachmentListItem';
import NoteListItem from './NoteListItem';

import styles from './styles.module.scss';

const ActivitySection = ({
  attachmentsToAdd,
  containedReports,
  notesToAdd,
  onDeleteAttachment,
  onDeleteNote,
  onSaveNote,
  reportAttachments,
  reportNotes,
  reportTracker,
}) => {
  const [timeSortOrder, setTimeSortOrder] = useState(DESCENDING_SORT_ORDER);
  const [cardsExpanded, setCardsExpanded] = useState([]);

  const onSaveNoteKeepExpanded = useCallback((originalNote) => (editedText) => {
    const editedNote = onSaveNote(originalNote, editedText);
    setCardsExpanded([...cardsExpanded.filter((cardExpanded) => cardExpanded !== originalNote), editedNote]);
  }, [cardsExpanded, onSaveNote]);

  const reportAttachmentsRendered = useMemo(() => reportAttachments.map((reportAttachment) => ({
    date: reportAttachment.updated_at || reportAttachment.created_at,
    node: <AttachmentListItem attachment={reportAttachment} key={reportAttachment.id} reportTracker={reportTracker} />,
  })), [reportAttachments, reportTracker]);

  const attachmentsToAddRendered = useMemo(() => attachmentsToAdd.map((attachmentToAdd) => ({
    date: attachmentToAdd.creationDate,
    node: <AttachmentListItem
      attachment={attachmentToAdd.file}
      key={attachmentToAdd.file.name}
      onDelete={() => onDeleteAttachment(attachmentToAdd.file)}
    />,
  })), [attachmentsToAdd, onDeleteAttachment]);

  const reportNotesRendered = useMemo(() => reportNotes.map((reportNote) => ({
    date: reportNote.updated_at || reportNote.created_at,
    node: <NoteListItem
      cardsExpanded={cardsExpanded}
      key={reportNote.id}
      note={reportNote}
      onCollapse={() => setCardsExpanded(cardsExpanded.filter((cardExpanded) => cardExpanded !== reportNote))}
      onExpand={() => setCardsExpanded([...cardsExpanded, reportNote])}
      onSave={onSaveNoteKeepExpanded(reportNote)}
    />,
  })), [cardsExpanded, onSaveNoteKeepExpanded, reportNotes]);

  const notesToAddRendered = useMemo(() => notesToAdd.map((noteToAdd) => ({
    date: noteToAdd.creationDate,
    node: <NoteListItem
      cardsExpanded={cardsExpanded}
      key={noteToAdd.text}
      note={noteToAdd}
      onCollapse={() => setCardsExpanded(cardsExpanded.filter((cardExpanded) => cardExpanded !== noteToAdd))}
      onDelete={() => onDeleteNote(noteToAdd)}
      onExpand={() => setCardsExpanded([...cardsExpanded, noteToAdd])}
      onSave={onSaveNoteKeepExpanded(noteToAdd)}
    />,
  })), [cardsExpanded, notesToAdd, onDeleteNote, onSaveNoteKeepExpanded]);

  const sortedItemsRendered = useMemo(
    () => [...reportAttachmentsRendered, ...reportNotesRendered, ...attachmentsToAddRendered, ...notesToAddRendered]
      .sort((a, b) => {
        if (timeSortOrder === DESCENDING_SORT_ORDER) {
          return a.date > b.date ? 1 : -1;
        }
        return a.date < b.date ? 1 : -1;
      })
      .map((item) => item.node),
    [attachmentsToAddRendered, notesToAddRendered, reportAttachmentsRendered, reportNotesRendered, timeSortOrder]
  );

  const areAllItemsExpanded = useMemo(
    () => cardsExpanded.length === notesToAdd.length + reportNotes.length,
    [cardsExpanded.length, notesToAdd.length, reportNotes.length],
  );

  const onClickExpandCollapseButton = useCallback(() => {
    setCardsExpanded(areAllItemsExpanded ? [] : [...reportNotes, ...notesToAdd]);
  }, [areAllItemsExpanded, notesToAdd, reportNotes]);

  const onClickTimeSortButton = useCallback(() => {
    setTimeSortOrder(timeSortOrder === DESCENDING_SORT_ORDER ? ASCENDING_SORT_ORDER : DESCENDING_SORT_ORDER);
  }, [timeSortOrder]);

  useEffect(() => {
    const newNotesToExpand = notesToAdd.filter((noteToAdd) => !noteToAdd.text && !cardsExpanded.includes(noteToAdd));
    if (newNotesToExpand.length > 0) {
      setCardsExpanded([...cardsExpanded, ...newNotesToExpand]);
    }
  }, [cardsExpanded, notesToAdd]);

  return <>
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <BulletListIcon />

        <h2>Activity</h2>
      </div>

      {sortedItemsRendered.length > 0 && <div className={styles.actions}>
        <label>Time</label>

        <Button
          className={styles.timeSortButton}
          data-testid="reportDetailView-activitySection-timeSortButton"
          onClick={onClickTimeSortButton}
          type="button"
          variant={timeSortOrder === DESCENDING_SORT_ORDER ? 'secondary' : 'primary'}
        >
          {timeSortOrder === DESCENDING_SORT_ORDER ? <ArrowDownIcon /> : <ArrowUpIcon />}
        </Button>

        <Button
          className={styles.expandCollapseButton}
          data-testid="reportDetailView-activitySection-expandCollapseButton"
          onClick={onClickExpandCollapseButton}
          type="button"
          variant="secondary"
        >
          {areAllItemsExpanded ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>}
    </div>

    {sortedItemsRendered.length > 0 && <ul className={styles.list}>{sortedItemsRendered}</ul>}

    {/* TODO: This is a temporal print of child reports for testing purposes */}
    {!!containedReports.length && containedReports.map((report) => <div key={report.id}>{report.id}<br/></div>)}
  </>;
};

ActivitySection.propTypes = {
  attachmentsToAdd: PropTypes.arrayOf(PropTypes.shape({
    creationDate: PropTypes.string,
    file: PropTypes.shape({
      name: PropTypes.string,
    }),
  })).isRequired,
  containedReports: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
  })).isRequired,
  notesToAdd: PropTypes.arrayOf(PropTypes.shape({
    creationDate: PropTypes.string,
    text: PropTypes.string,
  })).isRequired,
  onDeleteAttachment: PropTypes.func.isRequired,
  onDeleteNote: PropTypes.func.isRequired,
  onSaveNote: PropTypes.func.isRequired,
  reportAttachments: PropTypes.arrayOf(PropTypes.shape({
    created_at: PropTypes.string,
    id: PropTypes.string,
    updated_at: PropTypes.string,
  })).isRequired,
  reportNotes: PropTypes.arrayOf(PropTypes.shape({
    created_at: PropTypes.string,
    id: PropTypes.string,
    updated_at: PropTypes.string,
  })).isRequired,
  reportTracker: PropTypes.object.isRequired,
};

export default memo(ActivitySection);
