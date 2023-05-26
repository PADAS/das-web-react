import { generateDaysAgoDate } from '../utils/datetime';
import globallyResettableReducer from '../reducers/global-resettable';
import globalDateRangeReducerWithDefaultConfig, { RESET_DATE_RANGE, UPDATE_DATE_RANGE } from './global-date-range';
import { EVENT_STATE_CHOICES, REACT_APP_DEFAULT_EVENT_FILTER_FROM_DAYS } from '../constants';

const defaultDateRange = {
  lower: generateDaysAgoDate(REACT_APP_DEFAULT_EVENT_FILTER_FROM_DAYS).toISOString(),
  upper: null,
};

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
  },
};

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
  const { type, payload } = action;

  if (type === UPDATE_EVENT_FILTER) {
    return {
      ...state,
      ...payload,
      filter: {
        ...state.filter,
        ...payload.filter,
      }
    };
  }

  if (type === UPDATE_DATE_RANGE || type === RESET_DATE_RANGE) {
    return {
      ...state,
      filter: {
        ...state.filter,
        date_range: dateRangeReducer(state, action),
      }
    };
  }
  return state;
};

export default globallyResettableReducer(eventFilterReducer, INITIAL_FILTER_STATE);

/*
{
  state: Array<String> | of ‘new’, ‘active’, ‘resolved’,
  bbox: String | (Number,Number,Number,Number},
  is_collection: Bool,
  exclude_contained: Bool,
  include_files: Bool,
  include_notes: Bool,
  include_details: Bool,
  include_related_events: Bool,
  filter: {
    event_type: Array<String> | of event_type IDs,
    event_category: Array<String> | of event_category IDs,
    reported_by: Array<String> | of reported_by IDs,
    text: String | search substring,
    date_range: {
      lower: String | ISO8601 date,
      upper: String | ISO8601 date,
    },
    duration: String | ISO8601 duration value ("in the last X days"),
    priority: Array<Int> | of priority levels (0, 100, 200, 300)
  }
*/