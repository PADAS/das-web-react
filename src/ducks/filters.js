import { API_URL } from '../constants';
import { fetchEvents } from './events';
import { deleteHiddenSchemaProps, generateEnumAndNamesFromEnumOfObjects } from '../utils/schema';
import axios from 'axios';
export const EVENT_FILTER_SCHEMA_URL = `${API_URL}activity/eventfilters/schema`;

// actions
export const EVENT_FILTER_UPDATED = 'EVENT_FILTER_UPDATED';
export const FETCH_EVENT_FILTER_SCHEMA_SUCCESS = 'EVENT_FILTER_SCHEMA_SUCCESS';
export const FETCH_EVENT_FILTER_SCHEMA_ERROR = 'EVENT_FILTER_SCHEMA_ERROR';

export const fetchEventFilterSchema = () => function (dispatch) {
  axios.get(EVENT_FILTER_SCHEMA_URL).then((results) => {
    const { data: { data: { schema } } } = results;
    deleteHiddenSchemaProps(schema);
    Object.entries(schema.properties).filter(([, val]) => val.type === 'array').forEach(([key, val]) => {
      const { enum:enumVal, enumNames } = generateEnumAndNamesFromEnumOfObjects(val.items.enum);
      schema.properties[key].items.enum = enumVal;
      schema.properties[key].items.enumNames = enumNames;
      schema.properties[key].uniqueItems = true;
    });
    dispatch(fetchEventSchemaFilterSuccess(schema));
  })
    .catch((error) => {
      dispatch(fetchEventSchemaFilterError(error));
    });
}

export const updateEventFilter = (filter = {}) => {
  return function (dispatch) {
    dispatch(eventFilterUpdated(filter));
    dispatch(fetchEvents(filter));
  };
};

const fetchEventSchemaFilterSuccess = schema => ({
  type: FETCH_EVENT_FILTER_SCHEMA_SUCCESS,
  payload: schema,
});

const fetchEventSchemaFilterError = error => ({
  type: FETCH_EVENT_FILTER_SCHEMA_ERROR,
  payload: error,
});

// action creators
const eventFilterUpdated = filter => ({
  type: EVENT_FILTER_UPDATED,
  payload: filter,
});

const INITIAL_EVENT_FILTER_STATE = {};
export function eventFilterReducer(state = INITIAL_EVENT_FILTER_STATE, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case EVENT_FILTER_UPDATED: {
      return { ...state, ...payload };
    }
    default: {
      return state;
    }
  }
};

export function eventFilterSchemaReducer(state = {}, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_EVENT_FILTER_SCHEMA_SUCCESS: {
      return { ...state, ...payload };
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
    duration: {
      String | ISO8601 duration value ("in the last X days")
    },
    priority: Array<Int> | of priority levels (0, 100, 200, 300)
  }
*/