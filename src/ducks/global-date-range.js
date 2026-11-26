import { createTransform } from 'redux-persist';
import isEqual from 'react-fast-compare';
import omit from 'lodash/omit';

export const UPDATE_DATE_RANGE = 'UPDATE_DATE_RANGE';
export const RESET_DATE_RANGE = 'RESET_DATE_RANGE';

export const updateGlobalDateRange = update => dispatch => dispatch({
  payload: update,
  type: UPDATE_DATE_RANGE,
});

export const resetGlobalDateRange = () => dispatch => dispatch({
  type: RESET_DATE_RANGE,
});

// The default range moves with the day, so it is stored as absent and restored
// as the default of the day the app loads, not the one it was stored on.
export const withDefaultDateRangePersistence = (storageConfig, initialFilterState) => ({
  ...storageConfig,
  transforms: [
    ...(storageConfig.transforms ?? []),
    createTransform(
      (filter) => isEqual(filter.date_range, initialFilterState.filter.date_range)
        ? omit(filter, 'date_range')
        : filter,
      (filter) => filter.date_range ? filter : { ...filter, date_range: { ...initialFilterState.filter.date_range } },
      { whitelist: ['filter'] }
    ),
  ],
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

const globalDateRangeReducerWithDefaultConfig = (defaultConfig) => (state, action) =>
  globalDateRangeReducer(state, action, defaultConfig);

export default globalDateRangeReducerWithDefaultConfig;
