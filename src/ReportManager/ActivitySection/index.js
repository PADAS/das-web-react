import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';

import { TrackerContext } from '../../utils/analytics';
import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';

import AttachmentListItem from './AttachmentListItem';
import NoteListItem from './NoteListItem';
import ContainedReportListItem from './ContainedReportListItem';

import styles from './styles.module.scss';

const ATTACHMENT_ANALYTICS_SUBSTRING = 'attachment';
const CONTAINED_REPORT_ANALYTICS_SUBSTRING = 'contained report';
const EXISTING_NOTE_ANALYTICS_SUBSTRING = 'existing note';
const NEW_NOTE_ANALYTICS_SUBSTRING = 'new note';

const ActivitySection = ({
  attachmentsToAdd,
  containedReports,
  notesToAdd,
  onDeleteAttachment,
  onDeleteNote,
  onNewNoteHasChanged,
  onSaveNote,
  reportAttachments,
  reportNotes,
}) => {
  const reportTracker = useContext(TrackerContext);

  const [cardsExpanded, setCardsExpanded] = useState([]);

  const onCollapseCard = useCallback((card, analyticsLabel) => {
    if (cardsExpanded.includes(card)) {
      if (analyticsLabel) {
        reportTracker.track(`Collapse ${analyticsLabel} card in the activity section`);
      }

      setCardsExpanded([...cardsExpanded.filter((cardExpanded) => cardExpanded !== card)]);
    }
  }, [cardsExpanded, reportTracker]);

  const onExpandCard = useCallback((card, analyticsLabel) => {
    if (!cardsExpanded.includes(card)) {
      if (analyticsLabel) {
        reportTracker.track(`Expand ${analyticsLabel} card in the activity section`);
      }

      setCardsExpanded([...cardsExpanded, card]);
    }
  }, [cardsExpanded, reportTracker]);

  const onSaveNoteKeepExpanded = useCallback((originalNote) => (updatedNote) => {
    const editedNote = onSaveNote(originalNote, updatedNote);
    setCardsExpanded([...cardsExpanded.filter((cardExpanded) => cardExpanded !== originalNote), editedNote]);
  }, [cardsExpanded, onSaveNote]);

  const containedReportsRendered = useMemo(() => containedReports.map((containedReport) => ({
    sortDate: new Date(containedReport.time),
    node: <ContainedReportListItem
      cardsExpanded={cardsExpanded}
      key={containedReport.id}
      onCollapse={() => onCollapseCard(containedReport, CONTAINED_REPORT_ANALYTICS_SUBSTRING)}
      onExpand={() => onExpandCard(containedReport, CONTAINED_REPORT_ANALYTICS_SUBSTRING)}
      report={containedReport}
    />,
  })), [cardsExpanded, containedReports, onCollapseCard, onExpandCard]);

  const reportAttachmentsRendered = useMemo(() => reportAttachments.map((reportAttachment) => ({
    sortDate: new Date(reportAttachment.updated_at || reportAttachment.created_at),
    node: <AttachmentListItem
      attachment={reportAttachment}
      cardsExpanded={cardsExpanded}
      key={reportAttachment.id}
      onCollapse={() => onCollapseCard(reportAttachment, ATTACHMENT_ANALYTICS_SUBSTRING)}
      onExpand={() => onExpandCard(reportAttachment, ATTACHMENT_ANALYTICS_SUBSTRING)}
    />,
  })), [cardsExpanded, onCollapseCard, onExpandCard, reportAttachments]);

  const attachmentsToAddRendered = useMemo(() => attachmentsToAdd.map((attachmentToAdd) => ({
    sortDate: new Date(attachmentToAdd.creationDate),
    node: <AttachmentListItem
      attachment={attachmentToAdd.file}
      key={attachmentToAdd.file.name}
      onDelete={() => onDeleteAttachment(attachmentToAdd.file)}
      ref={attachmentToAdd.ref}
    />,
  })), [attachmentsToAdd, onDeleteAttachment]);

  const reportNotesRendered = useMemo(() => reportNotes.map((reportNote) => ({
    sortDate: new Date(reportNote.updated_at || reportNote.created_at),
    node: <NoteListItem
      cardsExpanded={cardsExpanded}
      key={reportNote.id}
      note={reportNote}
      onCollapse={() => onCollapseCard(reportNote, EXISTING_NOTE_ANALYTICS_SUBSTRING)}
      onExpand={() => onExpandCard(reportNote, EXISTING_NOTE_ANALYTICS_SUBSTRING)}
      onSave={onSaveNoteKeepExpanded(reportNote)}
    />,
  })), [cardsExpanded, onCollapseCard, onExpandCard, onSaveNoteKeepExpanded, reportNotes]);

  const notesToAddRendered = useMemo(() => notesToAdd.map((noteToAdd) => ({
    sortDate: new Date(noteToAdd.creationDate),
    node: <NoteListItem
      cardsExpanded={cardsExpanded}
      key={noteToAdd.text}
      note={noteToAdd}
      onCollapse={() => onCollapseCard(noteToAdd, NEW_NOTE_ANALYTICS_SUBSTRING)}
      onDelete={() => onDeleteNote(noteToAdd)}
      onExpand={() => onExpandCard(noteToAdd, NEW_NOTE_ANALYTICS_SUBSTRING)}
      onSave={onSaveNoteKeepExpanded(noteToAdd)}
      onNewNoteHasChanged={onNewNoteHasChanged}
      ref={noteToAdd.ref}
    />,
  })), [cardsExpanded, notesToAdd, onCollapseCard, onDeleteNote, onExpandCard, onSaveNoteKeepExpanded, onNewNoteHasChanged]);

  const sortableList = useMemo(() => [
    ...containedReportsRendered,
    ...reportAttachmentsRendered,
    ...reportNotesRendered,
    ...attachmentsToAddRendered,
    ...notesToAddRendered,
  ], [
    containedReportsRendered,
    reportAttachmentsRendered,
    reportNotesRendered,
    attachmentsToAddRendered,
    notesToAddRendered,
  ]);

  const onSort = useCallback((order) => {
    reportTracker.track(`Sort activity section in ${order} order`);
  }, [reportTracker]);

  const [SortButton, sortedItemsRendered] = useSortedNodesWithToggleBtn(sortableList, onSort);

  const reportImageAttachments = useMemo(
    () => reportAttachments.filter((reportAttachment) => reportAttachment.file_type === 'image'),
    [reportAttachments]
  );

  const areAllItemsExpanded = useMemo(
    () => cardsExpanded.length === (
      notesToAdd.length +
      reportNotes.length +
      reportImageAttachments.length +
      containedReportsRendered.length),
    [
      cardsExpanded.length,
      containedReportsRendered.length,
      notesToAdd.length,
      reportImageAttachments.length,
      reportNotes.length,
    ],
  );

  const onClickExpandCollapseButton = useCallback(() => {
    reportTracker.track(`${areAllItemsExpanded ? 'Collapse' : 'Expand'} All`);

    setCardsExpanded(areAllItemsExpanded
      ? []
      : [...reportNotes, ...notesToAdd, ...reportImageAttachments, ...containedReports]);
  }, [areAllItemsExpanded, containedReports, notesToAdd, reportImageAttachments, reportNotes, reportTracker]);


  useEffect(() => {
    notesToAdd.filter((noteToAdd) => !noteToAdd.text).forEach((noteToAdd) => onExpandCard(noteToAdd));
  }, [notesToAdd, onExpandCard]);

  return <div data-testid="reportManager-activitySection">
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
          data-testid="reportManager-activitySection-expandCollapseButton"
          onClick={onClickExpandCollapseButton}
          type="button"
          variant="secondary"
        >
          {areAllItemsExpanded ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>}
    </div>

    {!!sortableList.length && <ul className={styles.list} >
      {sortedItemsRendered}
    </ul>}

  </div>;
};

ActivitySection.defaultProps = {
  onNewNoteHasChanged: null,
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
  onNewNoteHasChanged: PropTypes.func,
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
};

export default memo(ActivitySection);
