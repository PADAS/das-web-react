import axios from 'axios';

import { API_URL, API_V2_URL } from '../../constants';
import { calcLocationParamStringForUserLocationCoords } from '../../utils/location';
import globallyResettableReducer from '../../reducers/global-resettable';
import sanitizeSchemas from './sanitizeSchemas';
import { selectEventTypeByValue } from '../../selectors/event-types';

const USE_EVENTTYPE_SCHEMA_V2_MOCK_API = process.env.REACT_APP_MOCK_EVENTTYPES_V2_API === 'true'
  && process.env.NODE_ENV === 'development';

export const EVENTS_SCHEMA_API_URL = `${API_URL}activity/events/schema`;
export const EVENT_TYPE_SCHEMA_API_URL = `${API_URL}activity/events/schema/eventtype`;
export const EVENT_TYPE_SCHEMA_V2_API_URL = (eventTypeValue) =>
  `${USE_EVENTTYPE_SCHEMA_V2_MOCK_API ? '/api/v2.0/' : API_V2_URL}activity/eventtypes/${eventTypeValue}/schema`;

// Actions
export const FETCH_EVENT_TYPE_SCHEMA = 'FETCH_EVENT_TYPE_SCHEMA';
export const FETCH_EVENT_TYPE_SCHEMA_SUCCESS = 'FETCH_EVENT_TYPE_SCHEMA_SUCCESS';
export const FETCH_EVENT_TYPE_SCHEMA_FAILURE = 'FETCH_EVENT_TYPE_SCHEMA_FAILURE';
export const FETCH_EVENTS_SCHEMA_SUCCESS = 'FETCH_EVENTS_SCHEMA_SUCCESS';

// Action creators
export const fetchEventsSchema = () => async (dispatch) => {
  const response = await axios.get(EVENTS_SCHEMA_API_URL);

  dispatch({ payload: response.data.data, type: FETCH_EVENTS_SCHEMA_SUCCESS });
};

export const fetchEventTypeSchema = (eventTypeValue, eventId) => async (dispatch, getState) => {
  dispatch({ type: FETCH_EVENT_TYPE_SCHEMA });

  const state = getState();
  const eventType = selectEventTypeByValue(state, eventTypeValue);
  const userLocationCoords = state.view.userLocation?.coords;

  try {
    const eventTypeSchemaApiURL = eventType.version === 1
      ? `${EVENT_TYPE_SCHEMA_API_URL}/${eventTypeValue}`
      : EVENT_TYPE_SCHEMA_V2_API_URL(eventTypeValue);
    const response = await axios.get(eventTypeSchemaApiURL, {
      params: {
        event_id: eventId,
        location: userLocationCoords
          ? calcLocationParamStringForUserLocationCoords(userLocationCoords)
          : undefined,
      },
    });

    const payload = { eventId, eventTypeValue, eventTypeVersion: eventType.version };
    if (eventType.version === 1) {
      const { schema, uiSchema } = sanitizeSchemas(response.data.data);

      payload.definition = response.data.data.definition;
      payload.schema = schema;
      payload.uiSchema = uiSchema;
    } else if (eventType.version === 2) {
      payload.schema = response.data;
    }

    dispatch({ payload, type: FETCH_EVENT_TYPE_SCHEMA_SUCCESS });
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
  case FETCH_EVENT_TYPE_SCHEMA:
    return { ...state, loading: true };

  case FETCH_EVENT_TYPE_SCHEMA_FAILURE:
    return {
      ...state,
      loading: false,
      [action.payload.eventTypeValue]: {
        ...state[action.payload.eventTypeValue],
        [action.payload.eventId]: action.payload.error,
      },
    };

  case FETCH_EVENT_TYPE_SCHEMA_SUCCESS:
    if (action.payload.eventTypeVersion === 1) {
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
        }
      };
    } else if (action.payload.eventTypeVersion === 2) {
      return {
        ...state,
        loading: false,
        [action.payload.eventTypeValue]: {
          ...state[action.payload.eventTypeValue],
          [action.payload.eventId || 'base']: action.payload.schema,
        }
      };
    }
    return state;

  case FETCH_EVENTS_SCHEMA_SUCCESS:
    return { ...state, globalSchema: action.payload };

  default:
    return state;
  }
};

export default globallyResettableReducer(eventSchemasReducer, INITIAL_STATE);
