import { generateMonthsAgoDate } from '../utils/datetime';
import globallyResettableReducer from '../reducers/global-resettable';
import globalDateRangeReducerWithDefaultConfig, { RESET_DATE_RANGE, UPDATE_DATE_RANGE } from './global-date-range';

// ACTIONS
const UPDATE_EVENT_FILTER = 'UPDATE_EVENT_FILTER';

const defaultDateRange = {
  lower: generateMonthsAgoDate(1).toISOString(),
  upper: null,
};

const dateRangeReducer = globalDateRangeReducerWithDefaultConfig(
  defaultDateRange
);

// ACTION CREATORS
export const updateEventFilter = update => (dispatch) => {
  dispatch({
    type: UPDATE_EVENT_FILTER,
    payload: update,
  });
};

// REDUCER
export const INITIAL_FILTER_STATE = {
  include_notes: true,
  include_related_events: true,
  state: ['active', 'new'],
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
      ...payload,
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