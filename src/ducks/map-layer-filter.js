import isEqual from 'react-fast-compare';

// ACTIONS
const UPDATE_MAP_LAYER_FILTER = 'UPDATE_MAP_LAYER_FILTER';
const RESET_MAP_LAYER_FILTER = 'RESET_MAP_LAYER_FILTER';

// ACTION CREATORS
export const updateMapLayerFilter = (update) => (dispatch) => {
  dispatch({
    type: UPDATE_MAP_LAYER_FILTER,
    payload: update,
  });
};

export const resetEventFilter = () => (dispatch) => {
  const freshFilter = INITIAL_FILTER_STATE;
  dispatch({
    type: RESET_MAP_LAYER_FILTER,
    payload: freshFilter,
  });
};

// REDUCER
export const INITIAL_FILTER_STATE = {
  state: ['active', 'new'],
  filter: {
    text: '',
  },
};

export default (state = INITIAL_FILTER_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
  case (UPDATE_MAP_LAYER_FILTER): {
    const updated = {
      ...state, ...payload, filter: {
        ...state.filter,
        ...payload.filter,
      }
    };
    if (isEqual(state, updated)) return state;
    return updated;
  }
  case (RESET_MAP_LAYER_FILTER): {
    return { ...payload };
  }
  default: {
    return state;
  }
  }
};
