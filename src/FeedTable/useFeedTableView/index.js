import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';

import { BREAKPOINTS, TAB_KEYS } from '../../constants';
import { getCurrentTabFromURL } from '../../utils/navigation';
import { setFeedTableView } from '../../ducks/feed-table-view';
import { useFeatureFlag, useMatchMedia } from '../../hooks';

const FEED_TABS = [TAB_KEYS.EVENTS, TAB_KEYS.PATROLS];

// Below the medium layout the table has no room, so the feed always shows.
const useFeedTableView = (tab) => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const isFeedTableEnabled = useFeatureFlag('FEED_TABLE');
  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  const feedTab = tab ?? getCurrentTabFromURL(pathname);
  const isTableViewChosen = useSelector((state) => !!state.view.feedTableView?.[feedTab]);

  const canShowTableView = !!isFeedTableEnabled && isMediumLayoutOrLarger && FEED_TABS.includes(feedTab);
  const isTableView = canShowTableView && isTableViewChosen;

  const toggleTableView = useCallback(
    () => dispatch(setFeedTableView(feedTab, !isTableView)),
    [dispatch, feedTab, isTableView]
  );

  return { canShowTableView, isTableView, toggleTableView };
};

// True once the feed has gone from its table back to its list, so the list
// appears the way the table does, but not each time the feed opens.
export const useIsListReturning = (isTableView) => {
  const [isListReturning, setIsListReturning] = useState(false);
  const [previousIsTableView, setPreviousIsTableView] = useState(isTableView);

  if (previousIsTableView !== isTableView) {
    setIsListReturning(!isTableView);
    setPreviousIsTableView(isTableView);
  }

  return isListReturning;
};

// A shared `?view=table` link opens the table; the URL is otherwise left alone.
export const useTableViewLink = () => {
  const dispatch = useDispatch();
  const { pathname, search } = useLocation();

  useEffect(() => {
    const feedTab = getCurrentTabFromURL(pathname);
    if (FEED_TABS.includes(feedTab) && new URLSearchParams(search).get('view') === 'table') {
      dispatch(setFeedTableView(feedTab, true));
    }
  }, [dispatch, pathname, search]);
};

export default useFeedTableView;
