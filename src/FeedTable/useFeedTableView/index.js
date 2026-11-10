import { useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
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

  // The list and the table cross-fade both ways where the browser can.
  const toggleTableView = useCallback(() => {
    const toggle = () => dispatch(setFeedTableView(feedTab, !isTableView));

    if (document.startViewTransition && !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      document.startViewTransition(() => flushSync(toggle));
    } else {
      toggle();
    }
  }, [dispatch, feedTab, isTableView]);

  return { canShowTableView, isTableView, toggleTableView };
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
