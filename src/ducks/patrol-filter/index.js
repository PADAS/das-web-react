import { endOfToday, generateDaysAgoDate } from '../../utils/datetime';
import globalDateRangeReducerWithDefaultConfig, { RESET_DATE_RANGE, UPDATE_DATE_RANGE } from '../global-date-range';
import { REACT_APP_DEFAULT_PATROL_FILTER_FROM_DAYS } from '../../constants';
import { generateOptionalStorageConfig } from '../../reducers/storage-config';

import globallyResettableReducer from '../../reducers/global-resettable';

const defaultDateRange = {
  lower: generateDaysAgoDate(REACT_APP_DEFAULT_PATROL_FILTER_FROM_DAYS).toISOString(),
  upper: endOfToday().toISOString(),
};

export const INITIAL_FILTER_STATE = {
  filter: {
    date_range: defaultDateRange,
    patrols_overlap_daterange: false,
    patrol_type: [],
    text: '',
    tracked_by: [],
  },
  status: [],
};

export const PATROL_FILTER_STORAGE_KEY = 'patrolFilter';
export const persistenceConfig = generateOptionalStorageConfig(PATROL_FILTER_STORAGE_KEY, INITIAL_FILTER_STATE);

const dateRangeReducer = globalDateRangeReducerWithDefaultConfig(defaultDateRange);

// ACTIONS
export const UPDATE_PATROL_FILTER = 'UPDATE_PATROL_FILTER';

// ACTION CREATORS
export const updatePatrolFilter = (update) => (dispatch) => {
  dispatch({ type: UPDATE_PATROL_FILTER, payload: update });
};

export const setDefaultDateRange = (lower, upper) => {
  INITIAL_FILTER_STATE.filter.date_range.lower = lower;
  INITIAL_FILTER_STATE.filter.date_range.upper = upper;

  return {
    type: UPDATE_PATROL_FILTER,
    payload: {
      filter: {
        date_range: {
          lower,
          upper,
        },
      },
    },
  };
};

// REDUCER
const patrolFilterReducer = (state = INITIAL_FILTER_STATE, action) => {
  switch (action.type) {
  case UPDATE_PATROL_FILTER:
    return {
      ...state,
      ...action.payload,
      filter: {
        ...state.filter,
        ...action.payload.filter,
      },
    };

  case UPDATE_DATE_RANGE:
  case RESET_DATE_RANGE:
    return {
      ...state,
      filter: {
        ...state.filter,
        date_range: dateRangeReducer(state, action),
      },
    };

  default:
    return state;
  }
};

export default globallyResettableReducer(patrolFilterReducer, INITIAL_FILTER_STATE);
