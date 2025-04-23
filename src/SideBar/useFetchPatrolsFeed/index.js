import { useEffect, useMemo, useRef, useState } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch, useSelector } from 'react-redux';

import { fetchPatrolsFeed } from '../../ducks/patrols';

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

  useEffect(() => {
    setLoadingPatrolsFeed(true);

    patrolFetchRef.current = dispatch(fetchPatrolsFeed());

    patrolFetchRef.current.request.finally(() => {
      setLoadingPatrolsFeed(false);
      patrolFetchRef.current = null;
    });

    return () => {
      const priorRequestCancelToken = patrolFetchRef?.current?.cancelToken;

      if (priorRequestCancelToken) {
        priorRequestCancelToken.cancel();
      }
    };
  }, [dispatch, patrolFilterParams]);

  return { loadingPatrolsFeed };
};

export default useFetchPatrolsFeed;
