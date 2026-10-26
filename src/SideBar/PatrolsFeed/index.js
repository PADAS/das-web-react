import { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectPatrolsFeedMappedFromStore } from '../../selectors/patrols';
import { sortPatrolList } from '../../utils/patrols';
import useFeedTableView from '../../FeedTable/useFeedTableView';
import useFetchPatrolsFeed from '../useFetchPatrolsFeed';
import useNavigate from '../../hooks/useNavigate';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';
import PatrolsTable from '../../FeedTable/PatrolsTable';

import * as styles from './styles.module.scss';

const PatrolsFeed = () => {
  const navigate= useNavigate();

  const { isTableView } = useFeedTableView();
  const { loadingPatrolsFeed } = useFetchPatrolsFeed();

  const patrolsFeedMappedFromStore = useSelector(selectPatrolsFeedMappedFromStore);

  const sortedPatrols = useMemo(() => sortPatrolList(patrolsFeedMappedFromStore), [patrolsFeedMappedFromStore]);

  if (isTableView) {
    return <div className={styles.tableView}>
      <PatrolFilter />

      <PatrolsTable loading={loadingPatrolsFeed} patrols={sortedPatrols} />
    </div>;
  }

  return <>
    <PatrolFilter />

    <PatrolList loading={loadingPatrolsFeed} onItemClick={(id) => navigate(id)} patrols={sortedPatrols} />
  </>;
};

export default memo(PatrolsFeed);
