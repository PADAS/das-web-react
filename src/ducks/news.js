import axios from 'axios';
import unionBy from 'lodash/unionBy';
import { API_URL } from '../constants';

export const NEWS_API_URL = `${API_URL}news/`;
const { get, post } = axios;

const FETCH_NEWS_SUCCESS = 'FETCH_NEWS_SUCCESS';
const FETCH_NEWS_NEXT_PAGE_SUCCESS = 'FETCH_NEWS_NEXT_PAGE_SUCCESS';

const READ_NEWS_ITEMS = 'READ_NEWS_ITEMS';

export const fetchNews = (params = {}) => get(NEWS_API_URL, { params: {
  include_additional_data: false, page_size: 25, ...params,
} });

export const readNews = (news) => {
  const paramString = news
    .map(({ id }) => id)
    .reduce((string, id, index, array) =>
      `${string}${id}${array.length - 1 === index ? '' : ','}`
    , 'read=');
  return post(`${NEWS_API_URL}${paramString}`);
};

export const readNewsSuccess = news => ({
  type: READ_NEWS_ITEMS,
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
  type === READ_NEWS_ITEMS) {
    return {
      ...state,
      results: unionBy(state.results || [], payload.results, 'id'),
    };
  }

  return state;
  
};