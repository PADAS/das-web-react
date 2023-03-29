import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';

import { TrackerContext } from '../../utils/analytics';
import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';

import styles from './styles.module.scss';

const ActivitySection = ({ containedReports, notesToAdd, onSaveNote, patrolAttachments, patrolNotes }) => {
  const patrolTracker = useContext(TrackerContext);

  const [cardsExpanded, setCardsExpanded] = useState([]);

  // TODO: This will be used once we add the cards
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

  const containedReportsRendered = useMemo(() => [], []);

  const sortableList = useMemo(() => [], []);

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
      notesToAdd.length +
      patrolNotes.length +
      patrolImageAttachments.length +
      containedReportsRendered.length),
    [
      cardsExpanded.length,
      containedReportsRendered.length,
      notesToAdd.length,
      patrolImageAttachments.length,
      patrolNotes.length,
    ],
  );

  const onClickExpandCollapseButton = useCallback(() => {
    patrolTracker.track(`${areAllItemsExpanded ? 'Collapse' : 'Expand'} All`);

    setCardsExpanded(areAllItemsExpanded
      ? []
      : [...patrolNotes, ...notesToAdd, ...patrolImageAttachments, ...containedReports]);
  }, [areAllItemsExpanded, containedReports, notesToAdd, patrolImageAttachments, patrolNotes, patrolTracker]);

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
