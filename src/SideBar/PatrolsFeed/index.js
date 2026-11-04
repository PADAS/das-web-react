import { lazy, memo, Suspense, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectPatrolsFeedMappedFromStore } from '../../selectors/patrols';
import { sortPatrolList } from '../../utils/patrols';
import useFeedTableView from '../../FeedTable/useFeedTableView';
import useFetchPatrolsFeed from '../useFetchPatrolsFeed';
import useNavigate from '../../hooks/useNavigate';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';

import * as styles from './styles.module.scss';

const PatrolsTable = lazy(() => import('../../FeedTable/PatrolsTable'));

const PatrolsFeed = () => {
  const navigate= useNavigate();

  const { isTableView } = useFeedTableView();

  const [tableToolbarContainer, setTableToolbarContainer] = useState(null);
  const { loadingPatrolsFeed } = useFetchPatrolsFeed();

  const patrolsFeedMappedFromStore = useSelector(selectPatrolsFeedMappedFromStore);

  const sortedPatrols = useMemo(() => sortPatrolList(patrolsFeedMappedFromStore), [patrolsFeedMappedFromStore]);

  if (isTableView) {
    return <div className={styles.tableView}>
      <PatrolFilter summaryActionsRef={setTableToolbarContainer} />

      <Suspense fallback={null}>
        <PatrolsTable loading={loadingPatrolsFeed} patrols={sortedPatrols} toolbarContainer={tableToolbarContainer} />
      </Suspense>
    </div>;
  }

  return <>
    <PatrolFilter />

    <PatrolList loading={loadingPatrolsFeed} onItemClick={(id) => navigate(id)} patrols={sortedPatrols} />
  </>;
};

export default memo(PatrolsFeed);
