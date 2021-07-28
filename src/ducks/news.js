import axios from 'axios';
import { API_URL } from '../constants';

export const NEWS_API_URL = `${API_URL}news`;
const { get, post } = axios;

export const fetchNews = (params = {}) => get(NEWS_API_URL, { params: {
  page_size: 10, ...params,
} });

export const readNews = (news) => {
  const paramString = news
    .map(({ id }) => id)
    .reduce((string, id, index, array) =>
      `${string}${id}${array.length - 1 === index ? '' : ','}`
    , '?read=');

  return post(`${NEWS_API_URL}${paramString}`);
};
