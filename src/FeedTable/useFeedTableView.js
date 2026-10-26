import { useCallback } from 'react';
import { useLocation } from 'react-router';

import useNavigate from '../hooks/useNavigate';

const VIEW_SEARCH_PARAM = 'view';
const TABLE_VIEW = 'table';

export const isTableViewSearch = (search) => new URLSearchParams(search).get(VIEW_SEARCH_PARAM) === TABLE_VIEW;

// The table view lives in the URL, so Back undoes an expand, a reload keeps it,
// and opening an item (a path without the param) collapses it.
const useFeedTableView = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  const isTableView = isTableViewSearch(search);

  const toggleTableView = useCallback(() => {
    const params = new URLSearchParams(search);
    if (isTableView) {
      params.delete(VIEW_SEARCH_PARAM);
    } else {
      params.set(VIEW_SEARCH_PARAM, TABLE_VIEW);
    }

    const query = params.toString();
    navigate(`${pathname}${query ? `?${query}` : ''}`);
  }, [isTableView, navigate, pathname, search]);

  return { isTableView, toggleTableView };
};

export default useFeedTableView;
