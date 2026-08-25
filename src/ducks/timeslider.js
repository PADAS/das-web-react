const SET_VIRTUAL_DATE = 'SET_VIRTUAL_DATE';
const CLEAR_VIRTUAL_DATE = 'CLEAR_VIRTUAL_DATE';
const SET_ACTIVE_STATE = 'SET_ACTIVE_STATE';

export const setVirtualDate = (date, { isAtRangeEnd = false } = {}) => ({
  type: SET_VIRTUAL_DATE,
  payload: { date, isAtRangeEnd },
});

export const clearVirtualDate = () => ({
  type: CLEAR_VIRTUAL_DATE,
});

export const setTimeSliderState = state => ({
  type: SET_ACTIVE_STATE,
  payload: state,
});

const INITIAL_STATE = {
  active: false,
  hasScrubbedIntoPast: false,
  virtualDate: null,
};

const timeSliderReducer = (state = INITIAL_STATE, { type, payload }) => {
  if (type === SET_VIRTUAL_DATE) {
    return {
      ...state,
      hasScrubbedIntoPast: state.hasScrubbedIntoPast || !payload.isAtRangeEnd,
      virtualDate: payload.date,
    };
  }
  if (type === CLEAR_VIRTUAL_DATE) {
    return {
      ...state,
      virtualDate: null,
    };
  }
  if (type === SET_ACTIVE_STATE) {
    return !payload ? INITIAL_STATE : {
      ...state,
      active: true,
    };
  }
  return state;
};

export default timeSliderReducer;
