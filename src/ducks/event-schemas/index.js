import axios from 'axios';

import { API_URL, API_V2_URL } from '../../constants';
import { calcLocationParamStringForUserLocationCoords } from '../../utils/location';
import globallyResettableReducer from '../../reducers/global-resettable';
import sanitizeSchemas from './sanitizeSchemas';
import { selectEventTypeByValue } from '../../selectors/event-types';

const USE_EVENTTYPE_SCHEMA_V2_MOCK_API = import.meta.env.REACT_APP_MOCK_EVENTTYPES_V2_API === 'true'
  && import.meta.env.DEV;

export const EVENTS_SCHEMA_API_URL = `${API_URL}activity/events/schema`;
export const EVENT_TYPE_SCHEMA_API_URL = `${API_URL}activity/events/schema/eventtype`;
export const EVENT_TYPE_SCHEMA_V2_API_URL = (eventTypeValue) =>
  `${USE_EVENTTYPE_SCHEMA_V2_MOCK_API ? '/api/v2.0/' : API_V2_URL}activity/eventtypes/${eventTypeValue}/schema`;

// Actions
export const FETCH_EVENTS_SCHEMA_SUCCESS = 'FETCH_EVENTS_SCHEMA_SUCCESS';

export const FETCH_EVENT_TYPE_SCHEMA = 'FETCH_EVENT_TYPE_SCHEMA';
export const FETCH_EVENT_TYPE_SCHEMA_V1_SUCCESS = 'FETCH_EVENT_TYPE_SCHEMA_V1_SUCCESS';
export const FETCH_EVENT_TYPE_SCHEMA_V2_SUCCESS = 'FETCH_EVENT_TYPE_SCHEMA_V2_SUCCESS';
export const FETCH_EVENT_TYPE_SCHEMA_FAILURE = 'FETCH_EVENT_TYPE_SCHEMA_FAILURE';

// Action creators
export const fetchEventsSchema = (params = {}, config = {}) => async (dispatch) => {
  const response = await axios.get(EVENTS_SCHEMA_API_URL, { params, ...config });
  dispatch({ payload: response.data.data, type: FETCH_EVENTS_SCHEMA_SUCCESS });
};

export const fetchEventTypeSchema = (eventTypeValue, eventId, extraParams = {}, axiosConfig = {}) => async (dispatch, getState) => {
  dispatch({ type: FETCH_EVENT_TYPE_SCHEMA });

  const state = getState();
  const eventType = selectEventTypeByValue(state, eventTypeValue);
  const userLocationCoords = state.view.userLocation?.coords;

  try {
    if (eventType.version === 1) {
      const response = await axios.get(`${EVENT_TYPE_SCHEMA_API_URL}/${eventTypeValue}`, {
        params: {
          event_id: eventId,
          location: userLocationCoords
            ? calcLocationParamStringForUserLocationCoords(userLocationCoords)
            : undefined,
          ...extraParams,
        },
        ...axiosConfig,
      });

      const { schema, uiSchema } = sanitizeSchemas(response.data.data);

      dispatch({
        payload: {
          definition: response.data.data.definition,
          eventId,
          eventTypeValue,
          schema: schema,
          uiSchema: uiSchema,
        },
        type: FETCH_EVENT_TYPE_SCHEMA_V1_SUCCESS,
      });
    } else if (eventType.version === 2) {
      const response = await axios.get(EVENT_TYPE_SCHEMA_V2_API_URL(eventTypeValue), {
        params: {
          event_id: eventId,
          location: userLocationCoords
            ? calcLocationParamStringForUserLocationCoords(userLocationCoords)
            : undefined,
          pre_render: true,
          ...extraParams,
        },
        ...axiosConfig,
      });

      const rawSchema = response.data;

      if (rawSchema?.schema) {
        // v2 endpoint returned v1-format schema (common for community event types)
        const { schema, uiSchema } = sanitizeSchemas(rawSchema);
        dispatch({
          payload: { definition: rawSchema.definition, eventId, eventTypeValue, schema, uiSchema },
          type: FETCH_EVENT_TYPE_SCHEMA_V1_SUCCESS,
        });
      } else {
        // Standard v2 format: { json, ui } directly or wrapped as { data: { json, ui }, status: {...} }
        const schema = rawSchema?.json ? rawSchema : rawSchema?.data;
        dispatch({
          payload: { eventId, eventTypeValue, schema },
          type: FETCH_EVENT_TYPE_SCHEMA_V2_SUCCESS,
        });
      }
    } else {
      throw new Error('Event type version is missing.');
    }
  } catch (error) {
    dispatch({
      payload: { error, eventId, eventTypeValue },
      type: FETCH_EVENT_TYPE_SCHEMA_FAILURE,
    });
  }
};

// Reducer
export const INITIAL_STATE = { loading: false };

const eventSchemasReducer = (state, action) => {
  switch (action.type) {
  case FETCH_EVENTS_SCHEMA_SUCCESS:
    return { ...state, globalSchema: action.payload };

  case FETCH_EVENT_TYPE_SCHEMA:
    return { ...state, loading: true };

  case FETCH_EVENT_TYPE_SCHEMA_V1_SUCCESS:
    return {
      ...state,
      loading: false,
      [action.payload.eventTypeValue]: {
        ...state[action.payload.eventTypeValue],
        [action.payload.eventId || 'base']: {
          definition: action.payload.definition,
          schema: action.payload.schema,
          uiSchema: action.payload.uiSchema,
        },
      },
    };

  case FETCH_EVENT_TYPE_SCHEMA_V2_SUCCESS:
    return {
      ...state,
      loading: false,
      [action.payload.eventTypeValue]: {
        ...state[action.payload.eventTypeValue],
        [action.payload.eventId || 'base']: action.payload.schema,
      },
    };

  case FETCH_EVENT_TYPE_SCHEMA_FAILURE:
    return {
      ...state,
      loading: false,
      [action.payload.eventTypeValue]: {
        ...state[action.payload.eventTypeValue],
        [action.payload.eventId || 'base']: action.payload.error,
      },
    };

  default:
    return state;
  }
};

export default globallyResettableReducer(eventSchemasReducer, INITIAL_STATE);
