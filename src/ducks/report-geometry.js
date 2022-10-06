import undoableReducer, { reset as undoableReset, undo as undoableUndo } from '../reducers/undoable';

export const REPORT_GEOMETRY_UNDOABLE_NAMESPACE = 'REPORT_GEOMETRY_UNDOABLE_NAMESPACE';

// actions
const SET_GEOMETRY_POINTS = 'SET_GEOMETRY_POINTS';

// action creators
export const setGeometryPoints = (points) => ({
  type: SET_GEOMETRY_POINTS,
  payload: { points },
});

export const reset = () => undoableReset(REPORT_GEOMETRY_UNDOABLE_NAMESPACE);

export const undo = () => undoableUndo(REPORT_GEOMETRY_UNDOABLE_NAMESPACE);

// reducer
export const INITIAL_STATE = { points: [] };

const reportGeometryReducer = (state = INITIAL_STATE, action = {}) => {
  switch (action.type) {
  case SET_GEOMETRY_POINTS:
    return { points: action.payload.points };

  default:
    return state;
  }
};

export default undoableReducer(reportGeometryReducer, REPORT_GEOMETRY_UNDOABLE_NAMESPACE);
