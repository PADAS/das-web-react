import undoableReducer from '../reducers/undoable';

export const REPORT_GEOMETRY_UNDOABLE_NAMESPACE = 'REPORT_GEOMETRY_UNDOABLE_NAMESPACE';

// actions
const SET_GEOMETRY_POINTS = 'SET_GEOMETRY_POINTS';

// action creators
export const setGeometryPoints = (points) => (dispatch) => dispatch({
  type: SET_GEOMETRY_POINTS,
  payload: { points },
});

// reducer
const INITIAL_STATE = { points: [] };

const reportGeometryReducer = (state = INITIAL_STATE, action = {}) => {
  switch (action.type) {
  case SET_GEOMETRY_POINTS:
    return { points: action.payload.points };

  default:
    return state;
  }
};

export default undoableReducer(reportGeometryReducer, REPORT_GEOMETRY_UNDOABLE_NAMESPACE);
