import { useEffect, useMemo, useRef, useState } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch, useSelector } from 'react-redux';

import { fetchPatrolsFeed } from '../../ducks/patrols';

const useFetchPatrolsFeed = () => {
  const dispatch = useDispatch();

  const patrolFilter = useSelector((state) => state.data.patrolFilter);
  const patrolsFeed = useSelector((state) => state.data.patrolsFeed);

  const patrolFilterParams = useMemo(() => {
    const filterParams = cloneDeep(patrolFilter);
    delete filterParams.filter.overlap;

    return filterParams;
  }, [patrolFilter]);

  const fetchedFilterParamsRef = useRef(patrolFilterParams);

  const [loadingPatrolsFeed, setLoadingPatrolsFeed] = useState(!(patrolsFeed?.length > 0));

  useEffect(() => {
    // Prevent setting loadingPatrolsFeed to false if a fetch is cancelled and
    // a new one started.
    let isLatestFetch = true;

    // Mounting refreshes the feed behind whatever is already listed. A filter
    // change invalidates that list, so the feed waits for the new results
    // instead.
    if (fetchedFilterParamsRef.current !== patrolFilterParams) {
      setLoadingPatrolsFeed(true);
    }
    fetchedFilterParamsRef.current = patrolFilterParams;

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
  }, [dispatch, patrolFilterParams]);

  return { loadingPatrolsFeed };
};

export default useFetchPatrolsFeed;
