import React, { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';

import AttachmentListItem from './AttachmentListItem';
import NoteListItem from './NoteListItem';
import ContainedReportListItem from './ContainedReportListItem';

import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';

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
}, ref) => {
  const [cardsExpanded, setCardsExpanded] = useState([]);

  const onCollapseCard = useCallback((card) => {
    if (cardsExpanded.includes(card)) {
      setCardsExpanded([...cardsExpanded.filter((cardExpanded) => cardExpanded !== card)]);
    }
  }, [cardsExpanded]);

  const onExpandCard = useCallback((card) => {
    if (!cardsExpanded.includes(card)) {
      setCardsExpanded([...cardsExpanded, card]);
    }
  }, [cardsExpanded]);

  const onSaveNoteKeepExpanded = useCallback((originalNote) => (editedText) => {
    const editedNote = onSaveNote(originalNote, editedText);
    setCardsExpanded([...cardsExpanded.filter((cardExpanded) => cardExpanded !== originalNote), editedNote]);
  }, [cardsExpanded, onSaveNote]);

  const containedReportsRendered = useMemo(() => containedReports.map((containedReport) => ({
    sortDate: new Date(containedReport.time),
    node: <ContainedReportListItem
      cardsExpanded={cardsExpanded}
      key={containedReport.id}
      onCollapse={() => onCollapseCard(containedReport)}
      onExpand={() => onExpandCard(containedReport)}
      report={containedReport}
    />,
  })), [cardsExpanded, containedReports, onCollapseCard, onExpandCard]);

  const reportAttachmentsRendered = useMemo(() => reportAttachments.map((reportAttachment) => ({
    sortDate: new Date(reportAttachment.updated_at || reportAttachment.created_at),
    node: <AttachmentListItem
      attachment={reportAttachment}
      cardsExpanded={cardsExpanded}
      key={reportAttachment.id}
      onCollapse={() => onCollapseCard(reportAttachment)}
      onExpand={() => onExpandCard(reportAttachment)}
      reportTracker={reportTracker}
    />,
  })), [cardsExpanded, onCollapseCard, onExpandCard, reportAttachments, reportTracker]);

  const attachmentsToAddRendered = useMemo(() => attachmentsToAdd.map((attachmentToAdd) => ({
    sortDate: new Date(attachmentToAdd.creationDate),
    node: <AttachmentListItem
      attachment={attachmentToAdd.file}
      key={attachmentToAdd.file.name}
      onDelete={() => onDeleteAttachment(attachmentToAdd.file)}
    />,
  })), [attachmentsToAdd, onDeleteAttachment]);

  const reportNotesRendered = useMemo(() => reportNotes.map((reportNote) => ({
    sortDate: new Date(reportNote.updated_at || reportNote.created_at),
    node: <NoteListItem
      cardsExpanded={cardsExpanded}
      key={reportNote.id}
      note={reportNote}
      onCollapse={() => onCollapseCard(reportNote)}
      onExpand={() => onExpandCard(reportNote)}
      onSave={onSaveNoteKeepExpanded(reportNote)}
    />,
  })), [cardsExpanded, onCollapseCard, onExpandCard, onSaveNoteKeepExpanded, reportNotes]);

  const notesToAddRendered = useMemo(() => notesToAdd.map((noteToAdd) => ({
    sortDate: new Date(noteToAdd.creationDate),
    node: <NoteListItem
      cardsExpanded={cardsExpanded}
      key={noteToAdd.text}
      note={noteToAdd}
      ref={noteToAdd.ref}
      onCollapse={() => onCollapseCard(noteToAdd)}
      onDelete={() => onDeleteNote(noteToAdd)}
      onExpand={() => onExpandCard(noteToAdd)}
      onSave={onSaveNoteKeepExpanded(noteToAdd)}
    />,
  })), [cardsExpanded, notesToAdd, onCollapseCard, onDeleteNote, onExpandCard, onSaveNoteKeepExpanded]);

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

  const [sortButton, sortedItemsRendered] = useSortedNodesWithToggleBtn(sortableList);

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
    setCardsExpanded(areAllItemsExpanded
      ? []
      : [...reportNotes, ...notesToAdd, ...reportImageAttachments, ...containedReports]);
  }, [areAllItemsExpanded, containedReports, notesToAdd, reportImageAttachments, reportNotes]);


  useEffect(() => {
    notesToAdd.filter((noteToAdd) => !noteToAdd.text).forEach((noteToAdd) => onExpandCard(noteToAdd));
  }, [notesToAdd, onExpandCard]);

  return <div data-testid="reportManager-activitySection" ref={ref}>
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <BulletListIcon />

        <h2>Activity</h2>
      </div>

      {sortableList.length > 0 && <div className={styles.actions}>
        <label>Time</label>

        {sortButton}

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

export default memo(forwardRef(ActivitySection));
