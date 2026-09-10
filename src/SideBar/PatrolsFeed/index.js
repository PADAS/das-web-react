import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectPatrolsFeedMappedFromStore } from '../../selectors/patrols';
import { sortPatrolList } from '../../utils/patrols';
import useFetchPatrolsFeed from '../useFetchPatrolsFeed';
import useNavigate from '../../hooks/useNavigate';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';

const PatrolsFeed = () => {
  const navigate= useNavigate();

  const { loadingPatrolsFeed } = useFetchPatrolsFeed();

  const patrolsFeedMappedFromStore = useSelector(selectPatrolsFeedMappedFromStore);

  const sortedPatrols = useMemo(() => sortPatrolList(patrolsFeedMappedFromStore), [patrolsFeedMappedFromStore]);

  return <>
    <PatrolFilter />

    <PatrolList loading={loadingPatrolsFeed} onItemClick={(id) => navigate(id)} patrols={sortedPatrols} />
  </>;
};

export default memo(PatrolsFeed);
