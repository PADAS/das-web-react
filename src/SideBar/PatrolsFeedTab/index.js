import React, { memo, useCallback, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getPatrolList } from '../../selectors/patrols';
import useNavigate from '../../hooks/useNavigate';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';
import { sortPatrolList } from '../../utils/patrols';
import { ScrollContext } from '../../ScrollContext';

const PatrolsFeedTab = ({ loadingPatrolsFeed }) => {
  const navigate= useNavigate();
  const patrols = useSelector(getPatrolList);
  const sortedPatrols = useMemo(() => sortPatrolList(patrols.results), [patrols.results]);
  const { setToScrollElementId, scrollElementIntoView } = useContext(ScrollContext);

  const onItemClick = useCallback((id) => {
    setToScrollElementId(id);
    navigate(id);
  }, [navigate, setToScrollElementId]);

  useEffect(() => {
    scrollElementIntoView();
  }, []);

  return <>
    <PatrolFilter />
    <PatrolList loading={loadingPatrolsFeed} onItemClick={onItemClick} patrols={sortedPatrols} />
  </>;
};

export default memo(PatrolsFeedTab);
