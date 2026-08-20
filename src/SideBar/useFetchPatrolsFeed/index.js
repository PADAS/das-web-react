import { useEffect, useMemo, useRef, useState } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch, useSelector } from 'react-redux';

import { fetchPatrolsFeed } from '../../ducks/patrols';

const useFetchPatrolsFeed = () => {
  const dispatch = useDispatch();

  const patrolFilter = useSelector((state) => state.data.patrolFilter);
  const patrolsFeed = useSelector((state) => state.data.patrolsFeed);

  const isPatrolsFeedPopulated = patrolsFeed?.length > 0;

  // Only fetch patrols feed if it is not populated or if the patrol filter has
  // changed.
  const shouldFetchPatrolsFeedRef = useRef(!isPatrolsFeedPopulated);

  const [loadingPatrolsFeed, setLoadingPatrolsFeed] = useState(!isPatrolsFeedPopulated);

  const patrolFilterParams = useMemo(() => {
    const filterParams = cloneDeep(patrolFilter);
    delete filterParams.filter.overlap;

    return filterParams;
  }, [patrolFilter]);

  useEffect(() => {
    if (shouldFetchPatrolsFeedRef.current) {
      // Flag to prevent setting loadingPatrolsFeed to false if a fetch is
      // cancelled and a new one started.
      let isLatestFetch = true;

      setLoadingPatrolsFeed(true);

      const patrolFetch = dispatch(fetchPatrolsFeed());

      patrolFetch.request.finally(() => {
        if (isLatestFetch) {
          setLoadingPatrolsFeed(false);
        }
      });

      return () => {
        patrolFetch.cancelToken.cancel();
        isLatestFetch = false;
      };
    } else {
      shouldFetchPatrolsFeedRef.current = true;
    }
  }, [dispatch, patrolFilterParams]);

  return { loadingPatrolsFeed };
};

export default useFetchPatrolsFeed;
