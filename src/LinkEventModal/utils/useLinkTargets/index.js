import { useCallback, useEffect, useRef, useState } from 'react';
import { isCancel } from 'axios';
import { useDispatch } from 'react-redux';

import { EVENT_LINK_TARGET_TYPES } from '../../../constants';
import { fetchIncidentLinkTargets } from '../../../ducks/events';
import { fetchPatrolLinkTargets } from '../../../ducks/patrols';
import { hasPatrolBegun } from '../../../utils/patrols';

const EMPTY_LINK_TARGETS = [];

const FETCH_LINK_TARGETS_BY_TYPE = {
  [EVENT_LINK_TARGET_TYPES.INCIDENT]: fetchIncidentLinkTargets,
  [EVENT_LINK_TARGET_TYPES.PATROL]: fetchPatrolLinkTargets,
};

// Only a patrol that began has a leg to hold the event, and a cancelled one may
// never have.
const FILTER_LINK_TARGETS_BY_TYPE = {
  [EVENT_LINK_TARGET_TYPES.INCIDENT]: (incidents) => incidents,
  [EVENT_LINK_TARGET_TYPES.PATROL]: (patrols) => patrols.filter(hasPatrolBegun),
};

const useLinkTargets = (type, searchText) => {
  const dispatch = useDispatch();

  const abortControllerRef = useRef(null);

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkTargets, setLinkTargets] = useState(EMPTY_LINK_TARGETS);
  const [nextPageUrl, setNextPageUrl] = useState(null);

  // A page that arrives after a newer request started is dropped.
  const fetchLinkTargets = useCallback(async (pageUrl = null) => {
    abortControllerRef.current?.abort();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setError(null);
    setIsLoading(!pageUrl);
    setNextPageUrl(null);

    try {
      const page = await dispatch(FETCH_LINK_TARGETS_BY_TYPE[type](
        searchText,
        { nextPageUrl: pageUrl, signal: abortController.signal }
      ));
      const pageLinkTargets = FILTER_LINK_TARGETS_BY_TYPE[type](page.results);

      setLinkTargets((currentLinkTargets) => pageUrl
        ? [...currentLinkTargets, ...pageLinkTargets]
        : pageLinkTargets);
      setNextPageUrl(page.next);
      setIsLoading(false);
    } catch (fetchError) {
      if (!isCancel(fetchError)) {
        setError(fetchError);
        setIsLoading(false);
      }
    }
  }, [dispatch, searchText, type]);

  const fetchNextPage = () => {
    if (nextPageUrl) {
      fetchLinkTargets(nextPageUrl);
    }
  };

  useEffect(() => {
    // Fetching on a new search is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLinkTargets();

    return () => abortControllerRef.current?.abort();
  }, [fetchLinkTargets]);

  return {
    error,
    fetchLinkTargets,
    fetchNextPage,
    hasNextPage: !!nextPageUrl,
    isLoading,
    linkTargets,
  };
};

export default useLinkTargets;
