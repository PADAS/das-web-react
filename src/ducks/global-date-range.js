export const UPDATE_DATE_RANGE = 'UPDATE_DATE_RANGE';
export const RESET_DATE_RANGE = 'RESET_DATE_RANGE';

export const updateGlobalDateRange = update => dispatch => dispatch({
  type: UPDATE_DATE_RANGE,
  payload: update,
});

export const resetGlobalDateRange = () => dispatch => dispatch({
  type: RESET_DATE_RANGE,
});

const globalDateRangeReducer = (state, action, defaultConfig) => {
  const { type, payload } = action;

  if (type === RESET_DATE_RANGE) {
    return defaultConfig;
  }

  if (type === UPDATE_DATE_RANGE) {
    return payload;
  }

  return state || defaultConfig;
};

const globalDateRangeReducerWithDefaultConfig = (defaultConfig) => (state, action) => globalDateRangeReducer(state, action, defaultConfig);

export default globalDateRangeReducerWithDefaultConfig;