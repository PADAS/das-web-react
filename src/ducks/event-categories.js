import axios from 'axios';

import { API_URL } from '../constants';
import globallyResettableReducer from '../reducers/global-resettable';

const EVENT_CATEGORIES_API_URL = `${API_URL}activity/events/categories`;

// Actions
const FETCH_EVENT_CATEGORIES_SUCCESS = 'FETCH_EVENT_CATEGORIES_SUCCESS';

// Action creators
export const fetchEventCategories = () => async (dispatch) => {
  const response = await axios.get(EVENT_CATEGORIES_API_URL);

  // Reduce the categories array from the response into an object that maps them by their value.
  const eventCategories = response.data.data.reduce((accumulator, eventCategory) => ({
    ...accumulator,
    [eventCategory.value]: eventCategory,
  }), {});

  dispatch({ payload: eventCategories, type: FETCH_EVENT_CATEGORIES_SUCCESS });
};

// Reducer
const INITIAL_STATE = {};

const eventCategoriesReducer = (state, action) => {
  switch (action.type) {
  case FETCH_EVENT_CATEGORIES_SUCCESS:
    return action.payload;

  default:
    return state;
  }
};

export default globallyResettableReducer(eventCategoriesReducer, INITIAL_STATE);
