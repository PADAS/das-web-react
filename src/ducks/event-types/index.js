import axios from 'axios';

import { API_URL, API_V2_URL } from '../../constants';
import globallyResettableReducer from '../../reducers/global-resettable';

const USE_EVENT_TYPES_V2_MOCK_API = process.env.REACT_APP_MOCK_EVENTTYPES_V2_API === 'true'
  && process.env.NODE_ENV === 'development';

export const EVENT_TYPES_API_URL = `${API_URL}activity/events/eventtypes`;
export const EVENT_TYPES_V2_API_URL =
  `${USE_EVENT_TYPES_V2_MOCK_API ? '/api/v2.0/' : API_V2_URL}activity/eventtypes`;

// Actions
export const FETCH_EVENT_TYPES_SUCCESS = 'FETCH_EVENT_TYPES_SUCCESS';

// Action creators
export const fetchEventTypes = () => async (dispatch) => {
  const eventTypesResponse = await axios.get(EVENT_TYPES_API_URL);
  // TODO: Remove this condition once the GET eventtypes v2 endpoint works
  const eventTypesV2Response = USE_EVENT_TYPES_V2_MOCK_API
    ? await axios.get(EVENT_TYPES_V2_API_URL)
    : { data: { data: [] } };

  // Technical debt: the eventTypes reducer is stored as an array, which makes the finding operations expensive for
  // selectors. It would be better to have a key - value data structure but doing that change will require a
  // regression.
  const eventTypes = [
    ...eventTypesResponse.data.data.map((eventType) => ({ ...eventType, version: 1 })),
    ...eventTypesV2Response.data.data.map((eventType) => ({ ...eventType, version: 2 })),
  ];

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
