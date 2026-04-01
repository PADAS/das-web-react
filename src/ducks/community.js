import axios from 'axios';

import { API_V2_URL } from '../constants';

export const COMMUNITY_INPUT_API_URL = (communityValue) =>
  `${API_V2_URL}community/${communityValue}`;

export const fetchCommunityInfo = (communityValue, config = {}) => () =>
  axios.get(COMMUNITY_INPUT_API_URL(communityValue), config).then((response) => response.data.data);
