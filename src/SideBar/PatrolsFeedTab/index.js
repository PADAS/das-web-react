import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

import useNavigate from '../../hooks/useNavigate';
import { selectPatrolsFeedMappedFromStore } from '../../selectors/patrols';
import { sortPatrolList } from '../../utils/patrols';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';

const PatrolsFeedTab = ({ loadingPatrolsFeed }) => {
  const navigate= useNavigate();

  const patrolsFeedMappedFromStore = useSelector(selectPatrolsFeedMappedFromStore);

  const sortedPatrols = useMemo(() => sortPatrolList(patrolsFeedMappedFromStore), [patrolsFeedMappedFromStore]);

  return <>
    <PatrolFilter />

    <PatrolList loading={loadingPatrolsFeed} onItemClick={(id) => navigate(id)} patrols={sortedPatrols} />
  </>;
};

export default memo(PatrolsFeedTab);
