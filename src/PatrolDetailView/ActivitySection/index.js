import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';

import { isGreaterThan } from '../../utils/datetime';
import { TrackerContext } from '../../utils/analytics';
import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';

import AttachmentListItem from '../../ReportManager/ActivitySection/AttachmentListItem';
import ContainedReportListItem from '../../ReportManager/ActivitySection/ContainedReportListItem';
import DateListItem from './DateListItem';
import NoteListItem from '../../ReportManager/ActivitySection/NoteListItem';

import styles from './styles.module.scss';

const ATTACHMENT_ANALYTICS_SUBSTRING = 'attachment';
const CONTAINED_REPORT_ANALYTICS_SUBSTRING = 'contained report';
const EXISTING_NOTE_ANALYTICS_SUBSTRING = 'existing note';
const NEW_NOTE_ANALYTICS_SUBSTRING = 'new note';

const ActivitySection = ({
  containedReports,
  onDeleteNote,
  onNewNoteHasChanged,
  onSaveNote,
  patrolAttachments,
  patrolEndTime,
  patrolNotes,
  patrolStartTime,
}) => {
  const patrolTracker = useContext(TrackerContext);

  const [cardsExpanded, setCardsExpanded] = useState([]);

  const onCollapseCard = useCallback((card, analyticsLabel) => {
    if (cardsExpanded.includes(card)) {
      if (analyticsLabel) {
        patrolTracker.track(`Collapse ${analyticsLabel} card in the activity section`);
      }

      setCardsExpanded([...cardsExpanded.filter((cardExpanded) => cardExpanded !== card)]);
    }
  }, [cardsExpanded, patrolTracker]);

  const onExpandCard = useCallback((card, analyticsLabel) => {
    if (!cardsExpanded.includes(card)) {
      if (analyticsLabel) {
        patrolTracker.track(`Expand ${analyticsLabel} card in the activity section`);
      }

      setCardsExpanded([...cardsExpanded, card]);
    }
  }, [cardsExpanded, patrolTracker]);

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

  const patrolDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    if (patrolStartTime && isGreaterThan(now, patrolStartTime)){
      dates.push({
        node: <DateListItem date={patrolStartTime} key="patrolStartTime" title="Started" />,
        sortDate: new Date(patrolStartTime),
      });
    }

    if (patrolEndTime && !isGreaterThan(patrolEndTime, now)){
      dates.push({
        node: <DateListItem date={patrolEndTime} key="patrolEndTime" title="Ended" />,
        sortDate: new Date(patrolEndTime),
      });
    }

    return dates;
  }, [patrolEndTime, patrolStartTime]);

  const patrolAttachmentsRendered = useMemo(() => patrolAttachments.map((patrolAttachment) => ({
    sortDate: new Date(patrolAttachment.updated_at || patrolAttachment.created_at),
    node: <AttachmentListItem
      attachment={patrolAttachment}
      cardsExpanded={cardsExpanded}
      key={patrolAttachment.id}
      onCollapse={() => onCollapseCard(patrolAttachment, ATTACHMENT_ANALYTICS_SUBSTRING)}
      onExpand={() => onExpandCard(patrolAttachment, ATTACHMENT_ANALYTICS_SUBSTRING)}
    />,
  })), [cardsExpanded, onCollapseCard, onExpandCard, patrolAttachments]);

  const patrolNotesRendered = useMemo(() => patrolNotes.map((patrolNote) => {
    const isNewNote = !patrolNote.id;

    return {
      sortDate: new Date(patrolNote.updated_at || patrolNote.created_at),
      node: <NoteListItem
        cardsExpanded={cardsExpanded}
        key={isNewNote ? patrolNote.text : patrolNote.id}
        note={patrolNote}
        onCollapse={() => onCollapseCard(
          patrolNote,
          isNewNote ? NEW_NOTE_ANALYTICS_SUBSTRING : EXISTING_NOTE_ANALYTICS_SUBSTRING
        )}
        onDelete={isNewNote ? () => onDeleteNote(patrolNote) : undefined}
        onExpand={() => onExpandCard(
          patrolNote,
          isNewNote ? NEW_NOTE_ANALYTICS_SUBSTRING : EXISTING_NOTE_ANALYTICS_SUBSTRING
        )}
        onNewNoteHasChanged={isNewNote ? onNewNoteHasChanged : undefined}
        onSave={onSaveNoteKeepExpanded(patrolNote)}
        ref={isNewNote ? patrolNote.ref : undefined}
      />,
    };
  }), [cardsExpanded, onCollapseCard, onDeleteNote, onExpandCard, onNewNoteHasChanged, onSaveNoteKeepExpanded, patrolNotes]);

  const sortableList = useMemo(() => [
    ...containedReportsRendered,
    ...patrolDates,
    ...patrolAttachmentsRendered,
    ...patrolNotesRendered,
  ], [containedReportsRendered, patrolAttachmentsRendered, patrolDates, patrolNotesRendered]);

  const onSort = useCallback((order) => {
    patrolTracker.track(`Sort activity section in ${order} order`);
  }, [patrolTracker]);

  const [SortButton, sortedItemsRendered] = useSortedNodesWithToggleBtn(sortableList, onSort);

  const patrolImageAttachments = useMemo(
    () => patrolAttachments.filter((patrolAttachment) => patrolAttachment.file_type === 'image'),
    [patrolAttachments]
  );

  const areAllItemsExpanded = useMemo(
    () => cardsExpanded.length === (
      patrolNotes.length +
      patrolImageAttachments.length +
      containedReportsRendered.length),
    [cardsExpanded.length, containedReportsRendered.length, patrolImageAttachments.length, patrolNotes.length],
  );

  const onClickExpandCollapseButton = useCallback(() => {
    patrolTracker.track(`${areAllItemsExpanded ? 'Collapse' : 'Expand'} All`);

    setCardsExpanded(areAllItemsExpanded ? [] : [...patrolNotes, ...patrolImageAttachments, ...containedReports]);
  }, [areAllItemsExpanded, containedReports, patrolImageAttachments, patrolNotes, patrolTracker]);

  useEffect(() => {
    patrolNotes
      .filter((patrolNote) => !patrolNote.id && !patrolNote.text)
      .forEach((patrolNote) => onExpandCard(patrolNote));
  }, [onExpandCard, patrolNotes]);

  return <div data-testid="patrols-activitySection">
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
            data-testid="patrolDetailView-activitySection-expandCollapseButton"
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
  containedReports: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
  })).isRequired,
  onDeleteNote: PropTypes.func.isRequired,
  onNewNoteHasChanged: PropTypes.func,
  onSaveNote: PropTypes.func.isRequired,
  patrolAttachments: PropTypes.arrayOf(PropTypes.shape({
    created_at: PropTypes.string,
    id: PropTypes.string,
    updated_at: PropTypes.string,
  })).isRequired,
  patrolEndTime: PropTypes.instanceOf(Date),
  patrolNotes: PropTypes.arrayOf(PropTypes.shape({
    created_at: PropTypes.string,
    id: PropTypes.string,
    updated_at: PropTypes.string,
  })).isRequired,
  patrolStartTime: PropTypes.instanceOf(Date),
};

export default memo(ActivitySection);
