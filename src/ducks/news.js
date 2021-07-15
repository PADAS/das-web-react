import axios from 'axios';
import unionBy from 'lodash/unionBy';
import { API_URL } from '../constants';

const NEWS_API = `${API_URL}news/`;
const { get, post } = axios;

const FETCH_NEWS_SUCCESS = 'FETCH_NEWS_SUCCESS';
const FETCH_NEWS_NEXT_PAGE_SUCCESS = 'FETCH_NEWS_NEXT_PAGE_SUCCESS';

const NEWS_ITEMS_HAVE_BEEN_READ = 'NEWS_ITEMS_HAVE_BEEN_READ';

export const fetchNews = (params = {}) => get(NEWS_API, { params: {
  include_additional_data: false, page_size: 25, ...params,
} });

export const readNews = (news) => {
  const paramString = news
    .map(({ id }) => id)
    .reduce((string, id, index, array) =>
      `${string}${id}${array.length - 1 === index ? '' : ','}`
    , 'read=');
  return post(`${NEWS_API}${paramString}`);
};

export const onNewsHasBeenRead = news => ({
  type: NEWS_ITEMS_HAVE_BEEN_READ,
  payload: news,
});


export const fetchNewsSuccess = news => ({
  type: FETCH_NEWS_SUCCESS,
  payload: news,
});

export const fetchNewsNextPageSuccess = nextPage => ({
  type: FETCH_NEWS_NEXT_PAGE_SUCCESS,
  payload: nextPage,
});

export default (state, action) => {
  const { type, payload } = action;

  if (type === FETCH_NEWS_SUCCESS) {
    return payload;
  }

  if (type === FETCH_NEWS_NEXT_PAGE_SUCCESS ||
  type === NEWS_ITEMS_HAVE_BEEN_READ) {
    return {
      ...state,
      results: unionBy(state.results || [], payload.results, 'id'),
    };
  }

  return state;
  
};