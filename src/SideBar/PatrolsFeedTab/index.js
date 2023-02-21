import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch, useSelector } from 'react-redux';

import { fetchPatrols } from '../../ducks/patrols';
import { getPatrolList } from '../../selectors/patrols';
import { MapContext } from '../../App';
import useNavigate from '../../hooks/useNavigate';

import PatrolFilter from '../../PatrolFilter';
import PatrolList from '../../PatrolList';

const PatrolsFeedTab = () => {
  const dispatch = useDispatch();
  const navigate= useNavigate();

  const map = useContext(MapContext);

  const patrolFilter = useSelector((state) => state.data.patrolFilter);
  const patrols = useSelector(getPatrolList);

  const patrolFetchRef = useRef(null);

  const [loadingPatrolsFeed, setLoadingPatrolsFeed] = useState(true);

  const patrolFilterParams = useMemo(() => {
    const filterParams = cloneDeep(patrolFilter);
    delete filterParams.filter.overlap;

    return filterParams;
  }, [patrolFilter]);

  const onItemClick = useCallback((id) => navigate(id), [navigate]);

  const fetchAndLoadPatrolData = useCallback(() => {
    patrolFetchRef.current = dispatch(fetchPatrols());

    patrolFetchRef.current.request.finally(() => {
      setLoadingPatrolsFeed(false);
      patrolFetchRef.current = null;
    });
  }, [dispatch]);

  useEffect(() => {
    setLoadingPatrolsFeed(true);
    fetchAndLoadPatrolData();

    return () => {
      const priorRequestCancelToken = patrolFetchRef?.current?.cancelToken;

      if (priorRequestCancelToken) {
        priorRequestCancelToken.cancel();
      }
    };
  }, [fetchAndLoadPatrolData, patrolFilterParams]);

  return <>
    <PatrolFilter />

    <PatrolList loading={loadingPatrolsFeed} map={map} onItemClick={onItemClick} patrols={patrols.results} />
  </>;
};

export default memo(PatrolsFeedTab);