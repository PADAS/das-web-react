import axios  from 'axios';
import { API_URL } from '../constants';

const { get } = axios;

const FETCH_NEWS_SUCCESS = 'FETCH_NEWS_SUCCESS';
const FETCH_NEWS_NEXT_PAGE_SUCCESS = 'FETCH_NEWS_NEXT_PAGE_SUCCESS';

const fetchNewsSuccess = payload => ({ 
  type: FETCH_NEWS_SUCCESS,
  payload,
});

const fetchNewsNextPageSuccess = payload => ({ 
  type: FETCH_NEWS_NEXT_PAGE_SUCCESS,
  payload,
});

export const fetchNews = () => (dispatch) => {
  return get(`${API_URL}news`)
    .then(({ data: { data } }) => {
      dispatch(fetchNewsSuccess(data));
    });
};

export const fetchNewsNextPage = url =>
  dispatch =>
    get(url)
      .then(({ data: { data } }) => {
        dispatch(fetchNewsNextPageSuccess(data));
      });

const INITIAL_STATE = [];

export default (state = INITIAL_STATE, action) => {
  const { type, payload } = action;

  if (type === FETCH_NEWS_SUCCESS) {
    return payload;
  }

  if (type === FETCH_NEWS_NEXT_PAGE_SUCCESS) {
    const { results: nextPageNews, count, next, previous } = payload;

    return {
      ...state,
      count,
      next,
      previous,
      results: [...state.results, ...nextPageNews],
    };
  }

  return state;
};