import { EVENT_STATE_CHOICES, REACT_APP_DEFAULT_EVENT_FILTER_FROM_DAYS } from '../../constants';
import { generateOptionalStorageConfig } from '../../reducers/storage-config';
import { generateDaysAgoDate } from '../../utils/datetime';
import globalDateRangeReducerWithDefaultConfig, { RESET_DATE_RANGE, UPDATE_DATE_RANGE } from '../global-date-range';
import globallyResettableReducer from '../../reducers/global-resettable';

const defaultDateRange = {
  lower: generateDaysAgoDate(REACT_APP_DEFAULT_EVENT_FILTER_FROM_DAYS).toISOString(),
  upper: null,
};

export const EVENT_FILTER_STORAGE_KEY = 'eventFilter';

export const INITIAL_FILTER_STATE = {
  include_notes: true,
  include_related_events: true,
  state: EVENT_STATE_CHOICES[0].value,
  filter: {
    date_range: defaultDateRange,
    event_type: [],
    event_category: [],
    text: '',
    duration: null,
    priority: [],
    reported_by: [],
    sort: null,
  },
};

export const persistenceConfig = generateOptionalStorageConfig(EVENT_FILTER_STORAGE_KEY, INITIAL_FILTER_STATE);

const dateRangeReducer = globalDateRangeReducerWithDefaultConfig(defaultDateRange);

// ACTIONS
export const UPDATE_EVENT_FILTER = 'UPDATE_EVENT_FILTER';

// ACTION CREATORS
export const updateEventFilter = update => (dispatch) => {
  dispatch({
    type: UPDATE_EVENT_FILTER,
    payload: update,
  });
};

export const setDefaultDateRange = (lower, upper) => {
  INITIAL_FILTER_STATE.filter.date_range.lower = lower;
  INITIAL_FILTER_STATE.filter.date_range.upper = upper;

  return {
    type: UPDATE_EVENT_FILTER,
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
const eventFilterReducer = (state, action) => {
  switch (action.type) {

  case UPDATE_EVENT_FILTER:
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

// We pass a copy of the INITIAL_FILTER_STATE, no its reference, so redux persist
// doesn't add the _persist flag to our original INITIAL_FILTER_STATE object
export default globallyResettableReducer(eventFilterReducer, { ...INITIAL_FILTER_STATE });
