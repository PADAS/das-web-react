import axios from 'axios';

import { API_URL, API_V2_URL } from '../../constants';
import globallyResettableReducer from '../../reducers/global-resettable';

const USE_EVENT_TYPES_V2_MOCK_API = import.meta.env.REACT_APP_MOCK_EVENTTYPES_V2_API === 'true'
  && import.meta.env.DEV;

export const EVENT_TYPES_API_URL = `${API_URL}activity/events/eventtypes`;
export const EVENT_TYPES_V2_API_URL =
  `${USE_EVENT_TYPES_V2_MOCK_API ? '/api/v2.0/' : API_V2_URL}activity/eventtypes`;
export const COMMUNITY_EVENT_TYPES_API_URL = (communityValue) =>
  `${API_V2_URL}community/${communityValue}/eventtypes`;

// Actions
export const FETCH_EVENT_TYPES_SUCCESS = 'FETCH_EVENT_TYPES_SUCCESS';

// Action creators
export const fetchEventTypes = (communityInputValue = null) => async (dispatch) => {
  if (communityInputValue) {
    const response = await axios.get(COMMUNITY_EVENT_TYPES_API_URL(communityInputValue), { skipAuth: true });
    const eventTypes = response.data.data.map((eventType) => ({ ...eventType, version: 2 }));
    dispatch({ payload: eventTypes, type: FETCH_EVENT_TYPES_SUCCESS });
    return;
  }

  const [eventTypesResponse, eventTypesV2Response] = await Promise.all([
    axios.get(EVENT_TYPES_API_URL),
    axios.get(EVENT_TYPES_V2_API_URL)
  ]);

  const byValue = new Map();
  eventTypesV2Response.data.data.forEach((eventType) => byValue.set(eventType.value, { ...eventType, version: 2 }));
  eventTypesResponse.data.data.forEach((eventType) => byValue.set(eventType.value, { ...eventType, version: 1 }));
  const eventTypes = Array.from(byValue.values());

  dispatch({ payload: eventTypes, type: FETCH_EVENT_TYPES_SUCCESS });
};

// Reducer
export const INITIAL_STATE = [];

const eventTypesReducer = (state, action) => {
  switch (action.type) {
  case FETCH_EVENT_TYPES_SUCCESS:
    return action.payload;

  default:
    return state;
  }
};

export default globallyResettableReducer(eventTypesReducer, INITIAL_STATE);
