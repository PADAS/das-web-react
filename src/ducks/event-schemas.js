import axios from 'axios';

import { API_URL } from '../constants';
import { generateFormSchemasFromEventTypeSchema } from '../utils/event-schemas';
import { calcLocationParamStringForUserLocationCoords } from '../utils/location';

import globallyResettableReducer from '../reducers/global-resettable';

const { get } = axios;


export const EVENT_SCHEMA_API_URL = `${API_URL}activity/events/schema`;
const EVENT_TYPE_SCHEMA_API_URL = `${API_URL}activity/events/schema/eventtype/`;

const FETCH_EVENT_TYPE_SCHEMA_SUCCESS = 'FETCH_EVENT_TYPE_SCHEMA_SUCCESS';
const FETCH_EVENT_SCHEMA_SUCCESS = 'FETCH_EVENT_SCHEMA_SUCCESS';

export const fetchEventSchema = () => dispatch => get(EVENT_SCHEMA_API_URL)
  .then(({ data: { data } }) => {
    dispatch(fetchEventSchemaSuccess(data));
  });

export const fetchEventTypeSchema = (name, event_id) => (dispatch, getState) => {
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
    );
};

const fetchEventTypeSchemaSuccess = payload => ({
  type: FETCH_EVENT_TYPE_SCHEMA_SUCCESS,
  payload,
});

const fetchEventSchemaSuccess = payload => ({
  type: FETCH_EVENT_SCHEMA_SUCCESS,
  payload,
});

const eventSchemasReducer = (state, action) => {
  const { type, payload } = action;

  if (type === FETCH_EVENT_TYPE_SCHEMA_SUCCESS) {
    const { name, schema, event_id } = payload;

    const { uiSchema, schema: newSchema } = generateFormSchemasFromEventTypeSchema(schema);

    const stateValue = {
      definition: schema.definition,
      schema: newSchema,
      uiSchema,
    };

    if (!event_id) {
      return { ...state, [name]: {
        ...state[name],
        base: stateValue,
      } };
    }

    return {
      ...state, [name]: {
        ...state[name],
        [event_id]: stateValue,
      }
    };
  }

  if (type === FETCH_EVENT_SCHEMA_SUCCESS) {
    return { ...state, globalSchema: payload };
  }

  return state;
};

export default globallyResettableReducer(eventSchemasReducer, {});