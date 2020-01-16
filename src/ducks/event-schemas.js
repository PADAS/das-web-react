import axios from 'axios';

import { API_URL } from '../constants';
import { generateFormSchemasFromEventTypeSchema } from '../utils/event-schemas';

const { get } = axios;


const EVENT_SCHEMA_API_URL = `${API_URL}activity/events/schema`;
const EVENT_TYPE_SCHEMA_API_URL = `${API_URL}activity/events/schema/eventtype/`;

const FETCH_EVENT_TYPE_SCHEMA_SUCCESS = 'FETCH_EVENT_TYPE_SCHEMA_SUCCESS';
const FETCH_EVENT_SCHEMA_SUCCESS = 'FETCH_EVENT_SCHEMA_SUCCESS';

export const fetchEventSchema = () => dispatch => get(EVENT_SCHEMA_API_URL)
  .then(({ data: { data } }) => {
    dispatch(fetchEventSchemaSuccess(data));
  });

export const fetchEventTypeSchema = name => dispatch =>
  get(`${EVENT_TYPE_SCHEMA_API_URL}${name}`)
    .then(({ data: { data: schema } }) => {
      dispatch(fetchEventTypeSchemaSuccess({ name, schema }));
    }
    );


const fetchEventTypeSchemaSuccess = payload => ({
  type: FETCH_EVENT_TYPE_SCHEMA_SUCCESS,
  payload,
});

const fetchEventSchemaSuccess = payload => ({
  type: FETCH_EVENT_SCHEMA_SUCCESS,
  payload,
});

export default (state = {}, action) => {
  const { type, payload } = action;

  if (type === FETCH_EVENT_TYPE_SCHEMA_SUCCESS) {
    const { name, schema  } = payload;

    const { uiSchema, schema:newSchema } = generateFormSchemasFromEventTypeSchema(schema);

    return { ...state, [name]: {
      definition: schema.definition,
      schema: newSchema,
      uiSchema,
    } };
  }

  if (type === FETCH_EVENT_SCHEMA_SUCCESS) {
    return { ...state, globalSchema: payload };
  }

  return state;
};