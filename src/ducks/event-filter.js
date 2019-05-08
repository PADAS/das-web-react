import isNil from 'lodash/isNil';
import isEqual from 'react-fast-compare';

import { generateOneMonthAgoDate } from '../utils/datetime';

// ACTIONS
const UPDATE_EVENT_FILTER = 'UPDATE_EVENT_FILTER';
const RESET_EVENT_FILTER = 'RESET_EVENT_FILTER';

// ACTION CREATORS
export const updateEventFilter = update => (dispatch) => {
  dispatch({
    type: UPDATE_EVENT_FILTER,
    payload: update,
  });
};

export const resetEventFilter = () => ({
  type: RESET_EVENT_FILTER,
  payload: null,
});

// REDUCER
const INITIAL_FILTER_STATE = {
  exclude_contained: true,
  include_notes: true,
  include_related_events: true,
  state: ['active', 'new'],
  filter: {
    date_range: {
      lower: null,
      upper: null,
    },
    event_type: [],
    event_category: [],
    text: '',
    duration: null,
    priority: [],
  },
};

export default (state = INITIAL_FILTER_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case (UPDATE_EVENT_FILTER): {
      const updated = { ...state, ...payload };
      if (isEqual(state, updated)) return state;
      return updated;
    }
    case (RESET_EVENT_FILTER): {
      return { ...INITIAL_FILTER_STATE };
    }
    default: {
      return state;
    }
  }
};

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