import axios from 'axios';

import { API_URL } from '../../constants';
import globallyResettableReducer from '../../reducers/global-resettable';

export const DEFAULT_PATROL_SEGMENT_TYPE = 'defaultPatrolSegmentType';

export const DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_API_URL
  = `${API_URL}activity/patrols/segments/types/default/schema/`;
export const PATROL_TYPE_SCHEMA_API_URL = (patrolTypeValue) =>
  `${API_URL}activity/patrols/types/${patrolTypeValue}/schema/`;

const SCHEMA_REQUEST_PARAMS = { pre_render: true, s_format: 'enum' };

// Actions
export const FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA
  = 'PATROL_SCHEMAS.FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA';
export const FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_SUCCESS
  = 'PATROL_SCHEMAS.FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_SUCCESS';
export const FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_FAILURE
  = 'PATROL_SCHEMAS.FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_FAILURE';

export const FETCH_PATROL_TYPE_SCHEMA = 'PATROL_SCHEMAS.FETCH_PATROL_TYPE_SCHEMA';
export const FETCH_PATROL_TYPE_SCHEMA_SUCCESS = 'PATROL_SCHEMAS.FETCH_PATROL_TYPE_SCHEMA_SUCCESS';
export const FETCH_PATROL_TYPE_SCHEMA_FAILURE = 'PATROL_SCHEMAS.FETCH_PATROL_TYPE_SCHEMA_FAILURE';

// Action creators
export const fetchDefaultPatrolSegmentTypeSchema = () => async (dispatch) => {
  dispatch({ type: FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA });

  try {
    const { data } = await axios.get(DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_API_URL, { params: SCHEMA_REQUEST_PARAMS });

    const schema = data?.json ? data : data?.data;

    dispatch({ payload: schema, type: FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_SUCCESS });

    return schema;
  } catch (error) {
    dispatch({ payload: error, type: FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_FAILURE });

    return null;
  }
};

export const fetchPatrolTypeSchema = (patrolTypeValue) => async (dispatch) => {
  dispatch({ payload: { patrolTypeValue }, type: FETCH_PATROL_TYPE_SCHEMA });

  try {
    const { data } = await axios.get(PATROL_TYPE_SCHEMA_API_URL(patrolTypeValue), { params: SCHEMA_REQUEST_PARAMS });

    const schema = data?.json ? data : data?.data;

    dispatch({ payload: { patrolTypeValue, schema }, type: FETCH_PATROL_TYPE_SCHEMA_SUCCESS });
  } catch (error) {
    dispatch({ payload: { error, patrolTypeValue }, type: FETCH_PATROL_TYPE_SCHEMA_FAILURE });
  }
};

// Reducer
export const INITIAL_STATE = {};

const patrolSchemasReducer = (state, { payload, type }) => {
  switch (type) {
  case FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA:
    return { ...state, [DEFAULT_PATROL_SEGMENT_TYPE]: { isLoading: true } };

  case FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_SUCCESS:
    return { ...state, [DEFAULT_PATROL_SEGMENT_TYPE]: { isLoading: false, schema: payload } };

  case FETCH_DEFAULT_PATROL_SEGMENT_TYPE_SCHEMA_FAILURE:
    return { ...state, [DEFAULT_PATROL_SEGMENT_TYPE]: { error: payload, isLoading: false } };

  case FETCH_PATROL_TYPE_SCHEMA:
    return { ...state, [payload.patrolTypeValue]: { isLoading: true } };

  case FETCH_PATROL_TYPE_SCHEMA_SUCCESS:
    return { ...state, [payload.patrolTypeValue]: { isLoading: false, schema: payload.schema } };

  case FETCH_PATROL_TYPE_SCHEMA_FAILURE:
    return { ...state, [payload.patrolTypeValue]: { error: payload.error, isLoading: false } };

  default:
    return state;
  }
};

export default globallyResettableReducer(patrolSchemasReducer, INITIAL_STATE);
