import { generateOneMonthAgoDate } from '../utils/datetime';

// ACTIONS
const UPDATE_EVENT_FILTER = 'UPDATE_EVENT_FILTER';
const RESET_EVENT_FILTER = 'RESET_EVENT_FILTER';

// ACTION CREATORS
export const updateEventFilter = config => (dispatch, getState) => {
  dispatch({
    type: UPDATE_EVENT_FILTER,
    payload: config,
  });
};

export const resetEventFilter = () => ({
    type: RESET_EVENT_FILTER,
    payload: null,
});

// REDUCER
export const INITIAL_FILTER_STATE = {
  exclude_contained: true,
  include_notes: true,
  include_related_events: true,
  state: ['active', 'new'],
  filter: {
    date_range: {
      lower: generateOneMonthAgoDate(),
      upper: '',
    },
    text: '',
  },
};

export default (state = INITIAL_FILTER_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case (UPDATE_EVENT_FILTER): {
      return Object.assign({}, state, payload);
    }
    case (RESET_EVENT_FILTER): {
      return INITIAL_FILTER_STATE;
    }
    default: {
      return state;
    }
  }
};