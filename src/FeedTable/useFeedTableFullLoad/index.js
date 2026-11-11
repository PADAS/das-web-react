import { useEffect, useMemo, useState } from 'react';
import { CancelToken, isCancel } from 'axios';
import { useDispatch, useSelector } from 'react-redux';

import { addFeedTableFullLoadPage, startFeedTableFullLoad } from '../../ducks/feed-table-sort';

// A failed page is retried after 2, 4 and 8 seconds, then the load pauses
// until the user retries it.
export const FULL_LOAD_RETRY_DELAY = 2000;
const FULL_LOAD_RETRIES = 3;

const INITIAL_RETRY_STATE = { failures: 0, key: null };

// A sort the API can't make covers only the loaded rows, so while one is on,
// every row of the feed is loaded apart from the feed, in large pages.
const useFeedTableFullLoad = ({
  fetchPage,
  firstPageUrl,
  hasMorePages,
  isEnabled,
  loadId = '',
  rows,
  selectStore,
  tab,
}) => {
  const dispatch = useDispatch();

  const fullLoad = useSelector((state) => state.view.feedTableSort[tab].fullLoad);
  const store = useSelector(selectStore);

  const [retryState, setRetryState] = useState(INITIAL_RETRY_STATE);

  const key = `${loadId} ${firstPageUrl}`;
  const isCurrent = fullLoad.key === key;
  const isActive = isEnabled && (hasMorePages || isCurrent);
  const failures = retryState.key === key ? retryState.failures : 0;
  const isPaused = failures > FULL_LOAD_RETRIES;
  const isLoading = isActive && !isPaused && (!isCurrent || !!fullLoad.next);
  const isShowingFullLoad = isEnabled && fullLoad.url === firstPageUrl;

  const loadedRows = useMemo(() => {
    if (!isShowingFullLoad) return rows;

    const shownIds = new Set(rows.map((row) => row.id));
    const otherRows = [];
    [...fullLoad.ids, ...fullLoad.loadingIds].forEach((id) => {
      if (!shownIds.has(id) && store[id]) {
        shownIds.add(id);
        otherRows.push(store[id]);
      }
    });

    return otherRows.length ? [...rows, ...otherRows] : rows;
  }, [fullLoad.ids, fullLoad.loadingIds, isShowingFullLoad, rows, store]);

  const retry = () => setRetryState({ failures: 0, key });

  useEffect(() => {
    const cancelTokenSource = CancelToken.source();
    let retryTimeout;

    if (isActive && !isPaused && !isCurrent) {
      dispatch(startFeedTableFullLoad(tab, key, firstPageUrl));
    } else if (isActive && !isPaused && fullLoad.next) {
      const loadPage = () => dispatch(fetchPage(fullLoad.next, cancelTokenSource.token)).then((page) => {
        dispatch(addFeedTableFullLoadPage(tab, key, page.results.map((row) => row.id), page.next));
        if (failures) {
          setRetryState(INITIAL_RETRY_STATE);
        }
      }, (error) => {
        if (!isCancel(error)) {
          setRetryState({ failures: failures + 1, key });
        }
      });

      retryTimeout = setTimeout(loadPage, failures ? FULL_LOAD_RETRY_DELAY * 2 ** (failures - 1) : 0);
    }

    return () => {
      cancelTokenSource.cancel();
      clearTimeout(retryTimeout);
    };
  }, [dispatch, failures, fetchPage, firstPageUrl, fullLoad.next, isActive, isCurrent, isPaused, key, tab]);

  return { isLoading, isPaused, retry, rows: loadedRows };
};

export default useFeedTableFullLoad;
