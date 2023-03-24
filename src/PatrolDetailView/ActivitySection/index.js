import React, { memo, useCallback, useContext, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import { TrackerContext } from '../../utils/analytics';

import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';

import { useSortedNodesWithToggleBtn } from '../../hooks/useSortedNodes';

import styles from './styles.module.scss';

const ActivitySection = () => {
  const reportTracker = useContext(TrackerContext);

  const sortableList = useMemo(() => [], []);

  const onSort = useCallback((order) => {
    reportTracker.track(`Sort activity section in ${order} order`);
  }, [reportTracker]);

  const [SortButton, sortedItemsRendered] = useSortedNodesWithToggleBtn(sortableList, onSort);

  const onClickExpandCollapseButton = useCallback(() => {}, []);

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
          Expand All
        </Button>
      </div>}
    </div>

    {!!sortableList.length && <ul className={styles.list} >
      {sortedItemsRendered}
    </ul>}
  </div>;
};

export default memo(ActivitySection);
