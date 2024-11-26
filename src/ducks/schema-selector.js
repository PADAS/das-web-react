/*ToDo: Delete this file once mock data is no longer needed for EFB support*/

import globallyResettableReducer from '../reducers/global-resettable';

const SET_MOCKED_JSON_SCHEMA = 'SET_MOCKED_JSON_SCHEMA';

export const setMockedJSONSchema = (payload) => ({
  type: SET_MOCKED_JSON_SCHEMA,
  payload
});

const INITIAL_SCHEMA_SELECTOR_STATE = {
  schema: null
};

const schemaSelectorReducer = (state, action) => {
  const { payload, type } = action;
  debugger
  if (type === SET_MOCKED_JSON_SCHEMA) {
    return {
      schema: payload
    };
  }
  return state;
};

export default globallyResettableReducer(schemaSelectorReducer, INITIAL_SCHEMA_SELECTOR_STATE);
