import { DEVELOPMENT_FEATURE_FLAGS } from '../constants';
const SET_FLAG_OVERRIDE_VALUE = 'SET_FLAG_OVERRIDE_VALUE';

export const setFlagOverrideValue = (flagName, value) => ({
  type: SET_FLAG_OVERRIDE_VALUE,
  payload: { flagName, value }
});

const INTIAL_REDUCER_STATE = {
  ENABLE_REPORT_NEW_UI: DEVELOPMENT_FEATURE_FLAGS.ENABLE_REPORT_NEW_UI,
};

const reducer = (state = INTIAL_REDUCER_STATE, action = {}) => {
  if (action.type === SET_FLAG_OVERRIDE_VALUE) {
    const { flagName, value } = action.payload;
    return {
      ...state,
      [flagName]: value,
    };
  }
  return state;
};

export default reducer;