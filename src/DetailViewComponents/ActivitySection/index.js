import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';

import { isGreaterThan } from '../../utils/datetime';
import { TrackerContext } from '../../utils/analytics';
import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';

import AttachmentListItem from './AttachmentListItem';
import ContainedReportListItem from './ContainedReportListItem';
import DateListItem from './DateListItem';
import NoteListItem from './NoteListItem';

import styles from './styles.module.scss';

const ATTACHMENT_ANALYTICS_SUBSTRING = 'attachment';
const CONTAINED_REPORT_ANALYTICS_SUBSTRING = 'contained report';
const EXISTING_NOTE_ANALYTICS_SUBSTRING = 'existing note';
const NEW_NOTE_ANALYTICS_SUBSTRING = 'new note';

const ActivitySection = ({
  attachments,
  attachmentsToAdd,
  containedReports,
  endTime,
  notes,
  notesToAdd,
  onDeleteAttachment,
  onDeleteNote,
  onNoteItemBlur,
  onNoteItemCancel,
  onSaveNote,
  startTime,
}) => {
  const tracker = useContext(TrackerContext);

  const [cardsExpanded, setCardsExpanded] = useState([]);

  const onCollapseCard = useCallback((card, analyticsLabel) => {
    if (cardsExpanded.includes(card)) {
      if (analyticsLabel) {
        tracker.track(`Collapse ${analyticsLabel} card in the activity section`);
      }

      setCardsExpanded([...cardsExpanded.filter((cardExpanded) => cardExpanded !== card)]);
    }
  }, [cardsExpanded, tracker]);

  const onExpandCard = useCallback((card, analyticsLabel) => {
    if (!cardsExpanded.includes(card)) {
      if (analyticsLabel) {
        tracker.track(`Expand ${analyticsLabel} card in the activity section`);
      }

      setCardsExpanded([...cardsExpanded, card]);
    }
  }, [cardsExpanded, tracker]);

  const onSaveNoteKeepExpanded = useCallback((originalNote) => (updatedNote) => {
    const editedNote = onSaveNote(originalNote, updatedNote);
    setCardsExpanded([...cardsExpanded.filter((cardExpanded) => cardExpanded !== originalNote), editedNote]);
  }, [cardsExpanded, onSaveNote]);

  const attachmentsRendered = useMemo(() => attachments.map((attachment) => ({
    sortDate: new Date(attachment.updated_at || attachment.created_at || attachment.updates[0].time),
    node: <AttachmentListItem
      attachment={attachment}
      cardsExpanded={cardsExpanded}
      key={attachment.id}
      onCollapse={() => onCollapseCard(attachment, ATTACHMENT_ANALYTICS_SUBSTRING)}
      onExpand={() => onExpandCard(attachment, ATTACHMENT_ANALYTICS_SUBSTRING)}
    />,
  })), [attachments, cardsExpanded, onCollapseCard, onExpandCard]);

  const attachmentsToAddRendered = useMemo(() => attachmentsToAdd.map((attachmentToAdd) => ({
    sortDate: new Date(attachmentToAdd.creationDate),
    node: <AttachmentListItem
      attachment={attachmentToAdd.file}
      key={attachmentToAdd.file.name}
      onDelete={() => onDeleteAttachment(attachmentToAdd.file)}
      ref={attachmentToAdd.ref}
    />,
  })), [attachmentsToAdd, onDeleteAttachment]);

  const containedReportsRendered = useMemo(() => containedReports.map((containedReport) => ({
    sortDate: new Date(containedReport.time || containedReport.updated_at),
    node: <ContainedReportListItem
      cardsExpanded={cardsExpanded}
      key={containedReport.id}
      onCollapse={() => onCollapseCard(containedReport, CONTAINED_REPORT_ANALYTICS_SUBSTRING)}
      onExpand={() => onExpandCard(containedReport, CONTAINED_REPORT_ANALYTICS_SUBSTRING)}
      report={containedReport}
    />,
  })), [cardsExpanded, containedReports, onCollapseCard, onExpandCard]);

  const datesRendered = useMemo(() => {
    const dates = [];
    const now = new Date();
    if (startTime && isGreaterThan(now, startTime)){
      dates.push({
        node: <DateListItem date={startTime} key="startTime" title="Started" />,
        sortDate: new Date(startTime),
      });
    }

    if (endTime && !isGreaterThan(endTime, now)){
      dates.push({
        node: <DateListItem date={endTime} key="endTime" title="Ended" />,
        sortDate: new Date(endTime),
      });
    }

    return dates;
  }, [endTime, startTime]);

  const notesRendered = useMemo(() => notes.map((note) => ({
    sortDate: new Date(note.updated_at || note.created_at || note.updates[0].time),
    node: <NoteListItem
      cardsExpanded={cardsExpanded}
      key={note.id}
      note={note}
      onBlur={onNoteItemBlur}
      onCancel={onNoteItemCancel}
      onCollapse={() => onCollapseCard(note, EXISTING_NOTE_ANALYTICS_SUBSTRING)}
      onExpand={() => onExpandCard(note, EXISTING_NOTE_ANALYTICS_SUBSTRING)}
      onSave={onSaveNoteKeepExpanded(note)}
    />,
  })), [cardsExpanded, notes, onCollapseCard, onExpandCard, onNoteItemBlur, onNoteItemCancel, onSaveNoteKeepExpanded]);

  const notesToAddRendered = useMemo(() => notesToAdd.map((noteToAdd) => ({
    sortDate: new Date(noteToAdd.creationDate),
    node: <NoteListItem
      cardsExpanded={cardsExpanded}
      key={noteToAdd.text}
      note={noteToAdd}
      onBlur={onNoteItemBlur}
      onCancel={onNoteItemCancel}
      onCollapse={() => onCollapseCard(noteToAdd, NEW_NOTE_ANALYTICS_SUBSTRING)}
      onDelete={() => onDeleteNote(noteToAdd)}
      onExpand={() => onExpandCard(noteToAdd, NEW_NOTE_ANALYTICS_SUBSTRING)}
      onSave={onSaveNoteKeepExpanded(noteToAdd)}
      ref={noteToAdd.ref}
    />,
  })), [
    notesToAdd,
    cardsExpanded,
    onNoteItemBlur,
    onNoteItemCancel,
    onSaveNoteKeepExpanded,
    onCollapseCard,
    onDeleteNote,
    onExpandCard,
  ]);

  const sortableList = useMemo(() => [
    ...attachmentsRendered,
    ...attachmentsToAddRendered,
    ...containedReportsRendered,
    ...datesRendered,
    ...notesRendered,
    ...notesToAddRendered,
  ], [
    attachmentsRendered,
    attachmentsToAddRendered,
    containedReportsRendered,
    datesRendered,
    notesRendered,
    notesToAddRendered,
  ]);

  const onSort = useCallback((order) => {
    tracker.track(`Sort activity section in ${order} order`);
  }, [tracker]);

  const [SortButton, sortedItemsRendered] = useSortedNodesWithToggleBtn(sortableList, onSort);

  const imageAttachments = useMemo(
    () => attachments.filter((attachment) => attachment.file_type === 'image'),
    [attachments]
  );

  const areAllItemsExpanded = useMemo(
    () => cardsExpanded.length === (
      containedReportsRendered.length +
      imageAttachments.length +
      notes.length +
      notesToAdd.length),
    [cardsExpanded.length, containedReportsRendered.length, imageAttachments.length, notes.length, notesToAdd.length],
  );

  const onClickExpandCollapseButton = useCallback(() => {
    tracker.track(`${areAllItemsExpanded ? 'Collapse' : 'Expand'} All`);

    setCardsExpanded(areAllItemsExpanded ? [] : [...containedReports, ...imageAttachments, ...notes, ...notesToAdd]);
  }, [areAllItemsExpanded, containedReports, imageAttachments, notes, notesToAdd, tracker]);

  useEffect(() => {
    notes.filter((note) => !note.id && !note.text).forEach((note) => onExpandCard(note));
    notesToAdd.filter((noteToAdd) => !noteToAdd.text).forEach((noteToAdd) => onExpandCard(noteToAdd));
  }, [notes, notesToAdd, onExpandCard]);

  return <div data-testid="detailView-activitySection">
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <BulletListIcon />

        <h2>Activity</h2>
      </div>

      {sortableList.length > 0 && <div className={styles.actions}>
        <label>Time</label>

        <SortButton />

        <Button
          className={styles.expandCollapseButton}
          data-testid="detailView-activitySection-expandCollapseButton"
          onClick={onClickExpandCollapseButton}
          type="button"
          variant="secondary"
        >
          {areAllItemsExpanded ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>}
    </div>

    {!!sortableList.length && <ul className={styles.list}>
      {sortedItemsRendered}
    </ul>}
  </div>;
};

ActivitySection.defaultProps = {
  endTime: null,
  startTime: null,
};

ActivitySection.propTypes = {
  attachments: PropTypes.arrayOf(PropTypes.shape({
    created_at: PropTypes.string,
    id: PropTypes.string,
    updated_at: PropTypes.string,
  })).isRequired,
  attachmentsToAdd: PropTypes.arrayOf(PropTypes.shape({
    creationDate: PropTypes.string,
    file: PropTypes.shape({
      name: PropTypes.string,
    }),
  })).isRequired,
  containedReports: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
  })).isRequired,
  endTime: PropTypes.instanceOf(Date),
  notes: PropTypes.arrayOf(PropTypes.shape({
    created_at: PropTypes.string,
    id: PropTypes.string,
    updated_at: PropTypes.string,
  })).isRequired,
  notesToAdd: PropTypes.arrayOf(PropTypes.shape({
    creationDate: PropTypes.string,
    text: PropTypes.string,
  })).isRequired,
  onDeleteAttachment: PropTypes.func.isRequired,
  onDeleteNote: PropTypes.func.isRequired,
  onNoteItemBlur: PropTypes.func.isRequired,
  onNoteItemCancel: PropTypes.func.isRequired,
  onSaveNote: PropTypes.func.isRequired,
  startTime: PropTypes.instanceOf(Date),
};

export default memo(ActivitySection);
