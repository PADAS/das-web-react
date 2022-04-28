// Actions
const SET_NAVIGATION_DATA = 'SET_NAVIGATION_DATA';

// Action creators
export const setData = (data) => (dispatch) => dispatch({ type: SET_NAVIGATION_DATA, payload: { data } });

// Reducer
const INITIAL_STATE = {};

const navigationReducer = (state = INITIAL_STATE, { type, payload }) => {
  switch (type) {
  case SET_NAVIGATION_DATA:
    return payload.data;

  default:
    return state;
  }
};

export default navigationReducer;
