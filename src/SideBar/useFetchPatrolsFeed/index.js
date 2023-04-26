import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch, useSelector } from 'react-redux';

import { fetchPatrols } from '../../ducks/patrols';

const useFetchPatrolsFeed = () => {
  const dispatch = useDispatch();

  const patrolFilter = useSelector((state) => state.data.patrolFilter);

  const patrolFetchRef = useRef(null);

  const [loadingPatrolsFeed, setLoadingPatrolsFeed] = useState(true);

  const patrolFilterParams = useMemo(() => {
    const filterParams = cloneDeep(patrolFilter);
    delete filterParams.filter.overlap;

    return filterParams;
  }, [patrolFilter]);

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

  return { loadingPatrolsFeed };
};

export default useFetchPatrolsFeed;
