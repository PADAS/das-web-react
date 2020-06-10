import isEqual from 'react-fast-compare';
import globallyResettableReducer from '../reducers/global-resettable';

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

// REDUCER
export const INITIAL_FILTER_STATE = {
  filter: {
    text: '',
  },
};

const mapLayerFilterReducer = (state, action) => {
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

export default globallyResettableReducer(mapLayerFilterReducer, INITIAL_FILTER_STATE);