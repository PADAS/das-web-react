import { useCallback, useMemo } from 'react';
import { matchPath, useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { REACT_APP_ROUTE_PREFIX } from '../../constants';
import { setData } from '../../ducks/navigation';
import { showSideBar } from '../../ducks/side-bar';

export const useNavigate = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  const navigate = useCallback((tab, id = '', queryObject = null, localData) => {
    let URL = REACT_APP_ROUTE_PREFIX;
    if (tab) {
      URL = `${URL}${tab}/`;
      if (id) {
        URL = `${URL}${id}/`;
      }
    }
    if (queryObject) {
      const queryString = Object.keys(queryObject)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(queryObject[key]))}`)
        .join('&');
      URL = `${URL}?${queryString}`;
    }

    if (localData) {
      dispatch(setData(localData));
    }

    dispatch(showSideBar());
    history.push(URL);
  }, [dispatch, history]);

  return navigate;
};

export const useLocationParameters = () => {
  const { pathname, search } = useLocation();

  const localData = useSelector((state) => state.view.navigation.data);

  const query = useMemo(() => {
    const rawQueryObject = Object.fromEntries(new URLSearchParams(search));
    const parsedQueryObject = Object.entries(rawQueryObject).reduce((accumulator, [key, value]) => {
      try {
        accumulator[key] = JSON.parse(value);
      } catch (error) {
        accumulator[key] = null;
      }
      return accumulator;
    }, {});

    return parsedQueryObject;
  }, [search]);

  // Using this instead of useParams so we can consume the parameters anywhere in our app
  // More info: https://github.com/remix-run/react-router/issues/5870#issuecomment-394194338
  const match = matchPath(pathname, {
    path: '/:tab?/:id?',
    exact: true,
    strict: false,
  });

  const itemId = match?.params?.id;
  const tab = match?.params?.tab;

  return { itemId, localData, query, tab };
};
