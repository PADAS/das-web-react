import { useCallback, useEffect } from 'react';
import { useLocation, useNavigationType, useNavigate as useRouterNavigate } from 'react-router';

import { getCurrentIdFromURL, getCurrentTabFromURL } from '../utils/navigation';
import { TAB_KEYS } from '../constants';
import useNavigate from '../hooks/useNavigate';

const VIEW_SEARCH_PARAM = 'view';
const TABLE_VIEW = 'table';

const FEED_TABS = [TAB_KEYS.EVENTS, TAB_KEYS.PATROLS];

export const isTableViewSearch = (search) => new URLSearchParams(search).get(VIEW_SEARCH_PARAM) === TABLE_VIEW;

// The events or patrols list, not an item in it.
const feedTabForPathname = (pathname) => {
  const tab = getCurrentTabFromURL(pathname);

  return FEED_TABS.includes(tab) && !getCurrentIdFromURL(pathname) ? tab : null;
};

// Each feed's last choice, kept in memory so it lasts until the page is closed
// or refreshed, never into a later visit.
const tableViewChoices = new Map();
let hasHandledPageLoad = false;

const readTableViewChoice = (tab) => tableViewChoices.get(tab) === true;

const writeTableViewChoice = (tab, isTableView) => {
  tableViewChoices.set(tab, isTableView);
};

export const resetFeedTableViewChoices = () => {
  tableViewChoices.clear();
  hasHandledPageLoad = false;
};

const searchWithView = (search, isTableView) => {
  const params = new URLSearchParams(search);
  if (isTableView) {
    params.set(VIEW_SEARCH_PARAM, TABLE_VIEW);
  } else {
    params.delete(VIEW_SEARCH_PARAM);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
};

// The table view lives in the URL, so Back undoes an expand and opening an item
// (a path without the param) collapses it. Each feed also remembers its last
// choice for the rest of the page's life, which `useRestoreFeedTableView`
// brings back.
const useFeedTableView = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  const isTableView = isTableViewSearch(search);

  const toggleTableView = useCallback(() => {
    const feedTab = feedTabForPathname(pathname);
    if (feedTab) {
      writeTableViewChoice(feedTab, !isTableView);
    }

    navigate(`${pathname}${searchWithView(search, !isTableView)}`);
  }, [isTableView, navigate, pathname, search]);

  return { isTableView, toggleTableView };
};

// A page load (a refresh, a new tab) always starts on the feed, even from a URL
// that asks for the table. After that, a URL that says which view wins and is
// remembered, and a list URL that doesn't say (a tab link, the way back from an
// item) gets the remembered view. Back and Forward to such a URL show it as it
// was, so Back can still undo an expand.
export const useRestoreFeedTableView = () => {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();
  const routerNavigate = useRouterNavigate();

  useEffect(() => {
    const isFirstLocation = !hasHandledPageLoad;
    hasHandledPageLoad = true;

    const feedTab = feedTabForPathname(pathname);
    if (!feedTab) return;

    if (isFirstLocation) {
      if (new URLSearchParams(search).has(VIEW_SEARCH_PARAM)) {
        routerNavigate(`${pathname}${searchWithView(search, false)}`, { replace: true });
      }
    } else if (new URLSearchParams(search).has(VIEW_SEARCH_PARAM)) {
      writeTableViewChoice(feedTab, isTableViewSearch(search));
    } else if (navigationType === 'POP') {
      writeTableViewChoice(feedTab, false);
    } else if (readTableViewChoice(feedTab)) {
      routerNavigate(`${pathname}${searchWithView(search, true)}`, { replace: true });
    }
  }, [navigationType, pathname, routerNavigate, search]);
};

export default useFeedTableView;
