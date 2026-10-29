import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigationType, useNavigate as useRouterNavigate } from 'react-router';

import { getCurrentIdFromURL, getCurrentTabFromURL } from '../utils/navigation';
import { TAB_KEYS } from '../constants';
import useNavigate from '../hooks/useNavigate';

const VIEW_SEARCH_PARAM = 'view';
const TABLE_VIEW = 'table';

const FEED_TABS = [TAB_KEYS.EVENTS, TAB_KEYS.PATROLS];

const storageKey = (tab) => `feedTableView.${tab}`;

export const isTableViewSearch = (search) => new URLSearchParams(search).get(VIEW_SEARCH_PARAM) === TABLE_VIEW;

// The events or patrols list, not an item in it.
const feedTabForPathname = (pathname) => {
  const tab = getCurrentTabFromURL(pathname);

  return FEED_TABS.includes(tab) && !getCurrentIdFromURL(pathname) ? tab : null;
};

const readTableViewChoice = (tab) => {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey(tab))) === true;
  } catch {
    return false;
  }
};

const writeTableViewChoice = (tab, isTableView) => {
  try {
    window.localStorage.setItem(storageKey(tab), JSON.stringify(isTableView));
  } catch {
    // Without storage the choice lasts as long as the URL keeps it.
  }
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
// choice, which `useRestoreFeedTableView` brings back.
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

// A URL that says which view wins and is remembered. A list URL that doesn't
// say (a tab link, a refresh, the way back from an item) gets the remembered
// view. Back and Forward to such a URL show it as it was, so Back can still
// undo an expand.
export const useRestoreFeedTableView = () => {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();
  const routerNavigate = useRouterNavigate();

  const isFirstLocationRef = useRef(true);

  useEffect(() => {
    const isFirstLocation = isFirstLocationRef.current;
    isFirstLocationRef.current = false;

    const feedTab = feedTabForPathname(pathname);
    if (!feedTab) return;

    if (new URLSearchParams(search).has(VIEW_SEARCH_PARAM)) {
      writeTableViewChoice(feedTab, isTableViewSearch(search));
    } else if (navigationType === 'POP' && !isFirstLocation) {
      writeTableViewChoice(feedTab, false);
    } else if (readTableViewChoice(feedTab)) {
      routerNavigate(`${pathname}${searchWithView(search, true)}`, { replace: true });
    }
  }, [navigationType, pathname, routerNavigate, search]);
};

export default useFeedTableView;
