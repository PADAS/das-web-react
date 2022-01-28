import axios from 'axios';

import configureEnv from '../constants.js';
configureEnv();

const { API_URL, HOST, PROTOCOL } = process.env;

const DAS_API_URL = `${PROTOCOL}://${HOST}${API_URL}`;

const USER_API_URL = `${DAS_API_URL}/user/me`;

export const fetchCurrentUserForRequest = async (req, _res, next) => {
  const headersObj = { ...req.headers, host: HOST, 'content-length': 0 };

  const response = await axios.get(USER_API_URL, { headers: headersObj })
    .catch((error) => {
      console.log('user fetch error');
      next(error);
    });

  req.userData = response?.data?.data;
  next();
};