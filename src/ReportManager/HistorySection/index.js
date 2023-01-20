import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as HistoryIcon } from '../../common/images/icons/history.svg';

import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';

import DateTime from '../../DateTime';

import styles from './styles.module.scss';

const HistorySection = ({ reportUpdates }) => {
  const updatesRendered = useMemo(() => reportUpdates.map((update) => ({
    sortDate: new Date(update.time),
    node: <li className={styles.historyListItem} key={update.time}>
      <div>
        {update.user.first_name && <p className={styles.user}>
          {`${update.user.first_name} ${update.user.last_name ?? ''}`}
        </p>}
        <p className={styles.message}>{update.message}</p>
        <p className={styles.secondaryMessage}>{update.secondaryMessage}</p>
      </div>

      <DateTime className={styles.date} date={update.time} showElapsed={false} />
    </li>,
  })), [reportUpdates]);

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
