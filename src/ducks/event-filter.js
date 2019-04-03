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

// REDUCER
const INITIAL_FILTER_STATE = {
  exclude_contained: true,
  include_notes: true,
  include_related_events: true,
  state: ['active', 'new'],
  date_range: {
    lower: null,
    upper: null,
  },
  filter: {
    text: null,
  },
};

export default (state = INITIAL_FILTER_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case (UPDATE_EVENT_FILTER): {
      return {
        ...state,
        ...payload,
      };
    }
    default: {
      return state;
    }
  }
};