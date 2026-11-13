import axios from 'axios';

import { API_V2_URL } from '../constants';
import globallyResettableReducer from '../reducers/global-resettable';

export const COMMUNITY_INPUT_API_URL = (communityValue) =>
  `${API_V2_URL}community/${communityValue}`;

// Actions
export const FETCH_COMMUNITY_INFO_SUCCESS = 'FETCH_COMMUNITY_INFO_SUCCESS';

// Action creators
export const fetchCommunityInfo = (communityValue) => async (dispatch) => {
  const response = await axios.get(COMMUNITY_INPUT_API_URL(communityValue), { skipAuth: true });
  dispatch({ payload: response.data.data, type: FETCH_COMMUNITY_INFO_SUCCESS });
  return response.data.data;
};

// Reducer
export const INITIAL_STATE = null;

const communityReducer = (state, action) => {
  switch (action.type) {
  case FETCH_COMMUNITY_INFO_SUCCESS:
    return action.payload;

  default:
    return state;
  }
};

export default globallyResettableReducer(communityReducer, INITIAL_STATE);
