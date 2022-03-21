const SEEN_WARNING_HEADER_MSG = 'SEEN_WARNING_HEADER_MSG';
const SEEN_403_ERROR_MSG = 'SEEN_403_ERROR_MSG';

export const setSeenWarningHeaderMessage = (payload) => ({
  type: SEEN_WARNING_HEADER_MSG,
  payload,
});

export const setSeen403ErrorMessage = (payload) => ({
  type: SEEN_403_ERROR_MSG,
  payload,
});

const INITIAL_STATE = {
  lastSeenWarningHeaderMessage: null,
  lastSeen403ErrorMessage: null,
};

const reducer = (state = INITIAL_STATE, { type, payload }) => {
  if (type === SEEN_WARNING_HEADER_MSG) {
    return {
      ...state,
      lastSeenWarningHeaderMessage: payload,
    };
  }

  if (type === SEEN_403_ERROR_MSG) {
    return {
      ...state,
      lastSeen403ErrorMessage: payload,
    };
  }

  return state;
};

export default reducer;