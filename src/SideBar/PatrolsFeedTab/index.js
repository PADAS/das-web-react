import React, { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { getPatrolList } from '../../selectors/patrols';
import useNavigate from '../../hooks/useNavigate';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';

const PatrolsFeedTab = ({ loadingPatrolsFeed }) => {
  const navigate= useNavigate();

  const patrols = useSelector(getPatrolList);

  const onItemClick = useCallback((id) => navigate(id), [navigate]);

  return <>
    <PatrolFilter />

    <PatrolList loading={loadingPatrolsFeed} onItemClick={onItemClick} patrols={patrols.results} />
  </>;
};

export default memo(PatrolsFeedTab);
