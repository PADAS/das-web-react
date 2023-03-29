import React, { useCallback, useMemo, useState } from 'react';
import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';
import styles from './styles.module.scss';
import AttachmentListItem from '../../ReportManager/ActivitySection/AttachmentListItem';
import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';
import Button from 'react-bootstrap/Button';
import NoteListItem from '../../ReportManager/ActivitySection/NoteListItem';
import { getEventIdsForCollection } from '../../utils/events';
import { getReportsForPatrol } from '../../utils/patrols';
import orderBy from 'lodash-es/orderBy';
import ContainedReportListItem from '../../ReportManager/ActivitySection/ContainedReportListItem';
import usePatrol from '../../hooks/usePatrol';
import DateListItem from './DateListItem';
import { isGreaterThan } from '../../utils/datetime';

const ActivitySection = ({ patrolAttachments, patrolNotes, patrol }) => {

  const patrolInfo = usePatrol(patrol);
  const { actualStartTime, actualEndTime } = patrolInfo ?? {};
  const patrolDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    const hasStarted = isGreaterThan(now, actualStartTime);
    const hasEnded = !isGreaterThan(actualEndTime, now);
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

  const reports = useMemo(() => allPatrolReports.map((report) => ({
    sortDate: new Date(report.updated_at || report.created_at),
    node: <ContainedReportListItem report={report} cardsExpanded={[]}/>,
  })), [allPatrolReports]);

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
    ...reports,
    ...patrolDates,
  ], [patrolAttachmentsRendered, patrolNotesRendered, reports, patrolDates]);

  const onSort = useCallback(() => {
  }, []);

  const [SortButton, sortedItemsRendered] = useSortedNodesWithToggleBtn(sortableList, onSort);

  const areAllItemsExpanded = useMemo(
    () => cardsExpanded.length === (patrolAttachmentsRendered.length + patrolNotesRendered.length ),
    [cardsExpanded.length, patrolAttachmentsRendered.length, patrolNotesRendered.length]);


  const onClickExpandCollapseButton = useCallback(() => {
    setCardsExpanded(areAllItemsExpanded
      ? []
      : [...patrolAttachmentsRendered]);
  }, [areAllItemsExpanded, patrolAttachmentsRendered]);


  return <div>
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

export default ActivitySection;
