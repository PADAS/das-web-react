import axios from 'axios';

import { API_URL } from '../constants';
import { generateFormSchemasFromEventTypeSchema } from '../utils/event-schemas';
import { calcLocationParamStringForUserLocationCoords } from '../utils/location';

import globallyResettableReducer from '../reducers/global-resettable';

const { get } = axios;


export const EVENT_SCHEMA_API_URL = `${API_URL}activity/events/schema`;
export const EVENT_TYPE_SCHEMA_API_URL = `${API_URL}activity/events/schema/eventtype/`;

const FETCH_EVENT_TYPE_SCHEMA = 'FETCH_EVENT_TYPE_SCHEMA';
const FETCH_EVENT_TYPE_SCHEMA_SUCCESS = 'FETCH_EVENT_TYPE_SCHEMA_SUCCESS';
const FETCH_EVENT_TYPE_SCHEMA_FAILURE = 'FETCH_EVENT_TYPE_SCHEMA_FAILURE';
const FETCH_EVENT_SCHEMA_SUCCESS = 'FETCH_EVENT_SCHEMA_SUCCESS';

export const fetchEventSchema = () => dispatch => get(EVENT_SCHEMA_API_URL)
  .then(({ data: { data } }) => {
    dispatch(fetchEventSchemaSuccess(data));
  });

export const fetchEventTypeSchema = (name, event_id) => (dispatch, getState) => {
  dispatch({ type: FETCH_EVENT_TYPE_SCHEMA });

  const state = getState();
  const params = {};

  let reqString = `${EVENT_TYPE_SCHEMA_API_URL}${name}`;
  if (event_id) {
    params.event_id = event_id;
  }

  if (state?.view?.userLocation?.coords) {
    params.location = calcLocationParamStringForUserLocationCoords(state.view.userLocation.coords);
  }

  return get(reqString, { params })
    .then(({ data: { data: schema } }) => {
      dispatch(fetchEventTypeSchemaSuccess({ name, schema, event_id }));
    }
    ).catch((error) => dispatch(fetchEventTypeSchemaFailure({ name, error, event_id })));
};

const fetchEventTypeSchemaSuccess = payload => ({
  type: FETCH_EVENT_TYPE_SCHEMA_SUCCESS,
  payload,
});

const fetchEventTypeSchemaFailure = (payload) => ({
  type: FETCH_EVENT_TYPE_SCHEMA_FAILURE,
  payload,
});

const fetchEventSchemaSuccess = payload => ({
  type: FETCH_EVENT_SCHEMA_SUCCESS,
  payload,
});

const eventSchemasReducer = (state, action) => {
  const { type, payload } = action;

  if (type === FETCH_EVENT_TYPE_SCHEMA) {
    return { ...state, loading: true };
  }

  if (type === FETCH_EVENT_TYPE_SCHEMA_SUCCESS) {
    const { name, schema, event_id } = payload;

    const { uiSchema, schema: newSchema } = generateFormSchemasFromEventTypeSchema(schema);

    const stateValue = {
      definition: schema.definition,
      schema: newSchema,
      uiSchema,
    };

    if (!event_id) {
      return {
        ...state,
        loading: false,
        [name]: {
          ...state[name],
          base: stateValue,
        }
      };
    }

    return {
      ...state,
      loading: false,
      [name]: {
        ...state[name],
        [event_id]: stateValue,
      }
    };
  }

  if (type === FETCH_EVENT_TYPE_SCHEMA_FAILURE) {
    const { name, event_id, error } = payload;

    return {
      ...state,
      loading: false,
      [name]: {
        ...state[name],
        [event_id]: error,
      }
    };
  }

  if (type === FETCH_EVENT_SCHEMA_SUCCESS) {
    return { ...state, globalSchema: payload };
  }

  return state;
};

export default globallyResettableReducer(eventSchemasReducer, {});