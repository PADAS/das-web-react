import axios from 'axios';
import { DAS_API_URL, HOST } from '../constants.js';

const USER_API_URL = `${DAS_API_URL}/user/me`;

export const fetchCurrentUserForRequest = async (req, res, next) => {
  const response = await axios.get(USER_API_URL, { headers: { ...req.headers, host: HOST } })
    .catch((error) => {
      next(error);
    });

  res.userData = response?.data?.data;
  next();
};