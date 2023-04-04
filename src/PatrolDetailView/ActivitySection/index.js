import React, { useCallback, useMemo, useState, memo, useContext, useEffect } from 'react';
import orderBy from 'lodash-es/orderBy';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';

import { TrackerContext } from '../../utils/analytics';
import AttachmentListItem from '../../ReportManager/ActivitySection/AttachmentListItem';
import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';
import NoteListItem from '../../ReportManager/ActivitySection/NoteListItem';
import { getEventIdsForCollection } from '../../utils/events';
import { actualEndTimeForPatrol, actualStartTimeForPatrol, getReportsForPatrol } from '../../utils/patrols';
import ContainedReportListItem from '../../ReportManager/ActivitySection/ContainedReportListItem';
import DateListItem from './DateListItem';
import { isGreaterThan } from '../../utils/datetime';

import styles from './styles.module.scss';

const ActivitySection = ({ patrolAttachments, patrolNotes, notesToAdd, patrol, onSaveNote }) => {
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

  // TODO: This will be used once we add the cards
  const onSaveNoteKeepExpanded = useCallback((originalNote) => (updatedNote) => {
    const editedNote = onSaveNote(originalNote, updatedNote);
    setCardsExpanded([...cardsExpanded.filter((cardExpanded) => cardExpanded !== originalNote), editedNote]);
  }, [cardsExpanded, onSaveNote]);

  const patrolImageAttachments = useMemo(
    () => patrolAttachments.filter((patrolAttachment) => patrolAttachment.file_type === 'image'),
    [patrolAttachments]
  );

  const actualStartTime = actualStartTimeForPatrol(patrol);
  const actualEndTime = actualEndTimeForPatrol(patrol);

  const patrolDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    const hasStarted = actualStartTime && isGreaterThan(now, actualStartTime);
    const hasEnded =  actualEndTime && !isGreaterThan(actualEndTime, now);
    if (hasStarted){
      dates.push({
        sortDate: new Date(actualStartTime),
        node: <DateListItem date={actualStartTime} title="Started" />
      });
    }
    if (hasEnded){
      dates.push({
        sortDate: new Date(actualEndTime),
        node: <DateListItem date={actualEndTime} title="Ended" />
      });
    }
    return dates;
  }, [actualEndTime, actualStartTime]);

  const patrolReports = useMemo(() =>
    getReportsForPatrol(patrol)
  , [patrol]);

  const allPatrolReports = useMemo(() => {
    // don't show the contained reports, which are also bound to the segment
    const allReports = [...patrolReports];
    const incidents = allReports.filter(report => report.is_collection);
    const incidentIds = incidents.reduce((accumulator, incident) => [...accumulator, ...(getEventIdsForCollection(incident)|| [])], []);
    const topLevelReports = allReports.filter(report =>
      !incidentIds.includes(report.id));

    return orderBy(topLevelReports, [
      (item) => {
        return new Date(item.updated_at);
      }], ['acs']);
  }, [patrolReports]);

  const containedReportsRendered = useMemo(() => allPatrolReports.map((report) => ({
    sortDate: new Date(report.updated_at || report.created_at),
    node: <ContainedReportListItem
        report={report}
        cardsExpanded={cardsExpanded}
        key={report.id}
        onCollapse={() => onCollapseCard(report)}
        onExpand={() => onExpandCard(report)}/>,
  })), [allPatrolReports, cardsExpanded, onCollapseCard, onExpandCard]);

  const patrolNotesRendered = useMemo(() => patrolNotes.map((patrolNote) => ({
    sortDate: new Date(patrolNote.updated_at || patrolNote.created_at),
    node: <NoteListItem
        cardsExpanded={cardsExpanded}
        key={patrolNote.id}
        note={patrolNote}
        onCollapse={() => onCollapseCard(patrolNote)}
        onExpand={() => onExpandCard(patrolNote)}
        onSave={() => {}}
    />,
  })), [cardsExpanded, onCollapseCard, onExpandCard, patrolNotes]);

  const patrolAttachmentsRendered = useMemo(() => patrolAttachments.map((patrolAttachment) => ({
    sortDate: new Date(patrolAttachment.updated_at || patrolAttachment.created_at),
    node: <AttachmentListItem
        attachment={patrolAttachment}
        cardsExpanded={cardsExpanded}
        key={patrolAttachment.id}
        onCollapse={() => onCollapseCard(patrolAttachment)}
        onExpand={() => onExpandCard(patrolAttachment)}
    />,
  })), [cardsExpanded, onCollapseCard, onExpandCard, patrolAttachments]);

  const sortableList = useMemo(() => [
    ...patrolAttachmentsRendered,
    ...patrolNotesRendered,
    ...containedReportsRendered,
    ...patrolDates,
  ], [patrolAttachmentsRendered, patrolNotesRendered, containedReportsRendered, patrolDates]);

  const onSort = useCallback((order) => {
    patrolTracker.track(`Sort activity section in ${order} order`);
  }, [patrolTracker]);

  const [SortButton, sortedItemsRendered] = useSortedNodesWithToggleBtn(sortableList, onSort);

  const areAllItemsExpanded = useMemo(
    () => cardsExpanded.length === (
      notesToAdd.length +
        patrolNotesRendered.length +
        patrolAttachmentsRendered.length ),
    [cardsExpanded.length, notesToAdd.length, patrolAttachmentsRendered.length, patrolNotesRendered.length],
  );

  const onClickExpandCollapseButton = useCallback(() => {
    patrolTracker.track(`${areAllItemsExpanded ? 'Collapse' : 'Expand'} All`);

    setCardsExpanded(areAllItemsExpanded
      ? []
      : [...patrolNotes, ...notesToAdd, ...patrolImageAttachments, ...containedReportsRendered]);
  }, [areAllItemsExpanded, containedReportsRendered, notesToAdd, patrolImageAttachments, patrolNotes, patrolTracker]);

  useEffect(() => {
    notesToAdd.filter((noteToAdd) => !noteToAdd.text).forEach((noteToAdd) => onExpandCard(noteToAdd));
  }, [notesToAdd, onExpandCard]);

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

ActivitySection.propTypes = {
  containedReports: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
  })).isRequired,
  notesToAdd: PropTypes.arrayOf(PropTypes.shape({
    creationDate: PropTypes.string,
    text: PropTypes.string,
  })).isRequired,
  onSaveNote: PropTypes.func.isRequired,
  patrolAttachments: PropTypes.arrayOf(PropTypes.shape({
    created_at: PropTypes.string,
    id: PropTypes.string,
    updated_at: PropTypes.string,
  })).isRequired,
  patrolNotes: PropTypes.arrayOf(PropTypes.shape({
    created_at: PropTypes.string,
    id: PropTypes.string,
    updated_at: PropTypes.string,
  })).isRequired,
};

export default memo(ActivitySection);
