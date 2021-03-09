import globallyResettableReducer from '../reducers/global-resettable';

// ACTIONS
const SET_CURRENT_TAB = 'SET_CURRENT_TAB';

// ACTION CREATORS
export const setCurrentReportTab = (reportType) => ({
  type: SET_CURRENT_TAB,
  payload: reportType
});

// reducers
const DEFAULT_TAB = 'event';

export const reportTabReducer = (state = DEFAULT_TAB, action) => {
  const { type, payload } = action;
  if (type === SET_CURRENT_TAB) return payload;
  return state;
};

export default globallyResettableReducer(reportTabReducer, DEFAULT_TAB);