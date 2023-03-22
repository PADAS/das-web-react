import React, { useCallback, useMemo, useState } from 'react';
import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';
import styles from './styles.module.scss';
import AttachmentListItem from '../../ReportManager/ActivitySection/AttachmentListItem';
import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';
import Button from 'react-bootstrap/Button';
import NoteListItem from "../../ReportManager/ActivitySection/NoteListItem";

const ActivitySection = ({ patrolAttachments, patrolNotes }) => {

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

  const patrolNotesRendered = useMemo(() => patrolNotes.map((patrolNote) => ({
    sortDate: new Date(patrolNote.updated_at || patrolNote.created_at),
    node: <NoteListItem
        cardsExpanded={cardsExpanded}
        key={patrolNote.id}
        note={patrolNote}
        onCollapse={() => onCollapseCard(patrolNote)}
        onExpand={() => onExpandCard(patrolNote)}
        onSave={()=>{}}
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
    ...patrolNotesRendered
  ], [patrolAttachmentsRendered, patrolNotesRendered]);

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
