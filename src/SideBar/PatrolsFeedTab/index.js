import React, { memo, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import useNavigate from '../../hooks/useNavigate';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';
import { sortPatrolList } from '../../utils/patrols';

const PatrolsFeedTab = ({ loadingPatrolsFeed }) => {
  const navigate= useNavigate();
  const patrolStore = useSelector((state) => state.data.patrolStore);
  const sortedPatrols = useMemo(() => sortPatrolList(Object.values(patrolStore)), [patrolStore]);

  const onItemClick = useCallback((id) => navigate(id), [navigate]);

  return <>
    <PatrolFilter />
    <PatrolList loading={loadingPatrolsFeed} onItemClick={onItemClick} patrols={sortedPatrols} />
  </>;
};

export default memo(PatrolsFeedTab);
