import { useCallback, useMemo } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { REACT_APP_ROUTE_PREFIX } from '../../constants';
import { setData } from '../../ducks/navigation';
import { showSideBar } from '../../ducks/side-bar';

const useURLNavigation = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const params = useParams();
  const { search } = useLocation();

  const localData = useSelector((state) => state.view.navigation.data);

  // TODO: this will need an error handler
  const query = useMemo(() => {
    const rawQueryObject = Object.fromEntries(new URLSearchParams(search));
    const parsedQueryObject = Object.entries(rawQueryObject).reduce((accumulator, [key, value]) => {
      accumulator[key] = JSON.parse(value);
      return accumulator;
    }, {});

    return parsedQueryObject;
  }, [search]);

  const navigate = useCallback((tab, id = '', queryObject = null, localData) => {
    let URL = `${REACT_APP_ROUTE_PREFIX}`;
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

  return { localData, navigate, params, query };
};

export default useURLNavigation;
