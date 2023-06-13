import React, { memo, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getPatrolList } from '../../selectors/patrols';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';
import { sortPatrolList } from '../../utils/patrols';
import useNavigationState from '../../hooks/useNavigationState';
import useNavigate from '../../hooks/useNavigate';

const PatrolsFeedTab = ({ loadingPatrolsFeed }) => {
  const patrols = useSelector(getPatrolList);
  const sortedPatrols = useMemo(() => sortPatrolList(patrols.results), [patrols.results]);
  const navigate = useNavigate();
  const { navigationState } = useNavigationState();

  const onItemClick = useCallback((id) => {
    navigate(id, { state: navigationState });
  }, [navigate, navigationState]);

  return <>
    <PatrolFilter />
    <PatrolList loading={loadingPatrolsFeed} onItemClick={onItemClick} patrols={sortedPatrols} />
  </>;
};

export default memo(PatrolsFeedTab);
