import axios from 'axios';
import { DAS_API_URL, HOST } from '../constants.js';

const USER_API_URL = `${DAS_API_URL}/user/me`;

export const fetchCurrentUserForRequest = async (req, _res, next) => {
  const headersObj = { ...req.headers, host: HOST };

  const response = await axios.get(USER_API_URL, { headers: headersObj })
    .catch((error) => {
      next(error);
    });

  req.userData = response?.data?.data;
  next();
};