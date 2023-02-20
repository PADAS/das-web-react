import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as HistoryIcon } from '../../common/images/icons/history.svg';

import { extractAttachmentUpdates } from '../../utils/patrols';
import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';

import UpdateListItem from './UpdateListItem';

import styles from './styles.module.scss';

const HistorySection = ({ patrolForm }) => {
  const updatesRendered = useMemo(() => {
    const [segmentsFirstLeg] = patrolForm.patrol_segments;

    const topLevelUpdates = patrolForm.updates;
    const { updates: segmentUpdates } = segmentsFirstLeg;
    const noteUpdates = extractAttachmentUpdates(patrolForm.notes);
    const fileUpdates = extractAttachmentUpdates(patrolForm.files);
    const eventUpdates = extractAttachmentUpdates(segmentsFirstLeg.events);

    const allUpdates = [...topLevelUpdates, ...segmentUpdates, ...noteUpdates, ...fileUpdates, ...eventUpdates];
    return allUpdates.map((update) => ({
      sortDate: new Date(update.time),
      node: <UpdateListItem
        key={update.time}
        message={update.message}
        secondaryMessage={update.secondaryMessage}
        time={update.time}
        user={update.user}
      />,
    }));
  }, [patrolForm.files, patrolForm.notes, patrolForm.patrol_segments, patrolForm.updates]);

  const [sortButton, sortedItemsRendered] = useSortedNodesWithToggleBtn(updatesRendered);

  return <div data-testid="patrolDetailView-historySection">
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <HistoryIcon />

        <h2>History</h2>
      </div>

      <div className={styles.actions}>
        <label>Time</label>

        {sortButton}
      </div>
    </div>

    <ul className={styles.historyList}>{sortedItemsRendered}</ul>
  </div>;
};

HistorySection.propTypes = {
  patrolForm: PropTypes.shape({
    files: PropTypes.array,
    notes: PropTypes.array,
    patrol_segments: PropTypes.array,
    updates: PropTypes.array,
  }).isRequired,
};

export default memo(HistorySection);
