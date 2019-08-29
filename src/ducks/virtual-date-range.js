const SET_VIRTUAL_DATE_RANGE = 'SET_VIRTUAL_DATE_RANGE';

export const setVirtualDateRange = range => ({
  type: SET_VIRTUAL_DATE_RANGE,
  payload: range,
});

const INITIAL_VIRTUAL_DATE_RANGE = {
  start: null,
  end: null,
};

export default (state = INITIAL_VIRTUAL_DATE_RANGE, { type, payload }) => {
  if (type === SET_VIRTUAL_DATE_RANGE) {
    return {
      ...state,
      ...payload,
    };
  }
  return state;
};