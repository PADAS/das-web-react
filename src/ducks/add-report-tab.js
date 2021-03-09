import globallyResettableReducer from '../reducers/global-resettable';
import { TAB_KEYS } from '../constants';

// ACTIONS
const SET_CURRENT_TAB = 'SET_CURRENT_TAB';

// ACTION CREATORS
export const setActiveAddReportTab = (reportType) => ({
  type: SET_CURRENT_TAB,
  payload: reportType
});

// reducers
const DEFAULT_TAB = TAB_KEYS.REPORTS;

export const addReportTabReducer = (state = DEFAULT_TAB, action) => {
  const { type, payload } = action;
  if (type === SET_CURRENT_TAB) return payload;
  return state;
};

export default globallyResettableReducer(addReportTabReducer, DEFAULT_TAB);