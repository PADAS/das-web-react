import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as HistoryIcon } from '../../common/images/icons/history.svg';

import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';

import UpdateListItem from './UpdateListItem';

import styles from './styles.module.scss';

const FILTERED_UPDATE_MESSAGES = ['Updated fields: '];

const HistorySection = ({ reportUpdates }) => {
  const updatesRendered = useMemo(() => reportUpdates.reduce((accumulator, update) => {
    if (!FILTERED_UPDATE_MESSAGES.includes(update.message)) {
      accumulator.push({
        sortDate: new Date(update.time),
        node: <UpdateListItem
          key={update.time}
          message={update.message}
          secondaryMessage={update.secondaryMessage}
          time={update.time}
          user={update.user}
        />,
      });
    }

    return accumulator;
  }, []), [reportUpdates]);

  const [sortButton, sortedItemsRendered] = useSortedNodesWithToggleBtn(updatesRendered);

  return <div data-testid="reportManager-historySection">
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
  reportUpdates: PropTypes.arrayOf(PropTypes.shape({
    message: PropTypes.string,
    secondaryMessage: PropTypes.string,
    time: PropTypes.string,
    user: PropTypes.object,
  })).isRequired,
};

export default memo(HistorySection);