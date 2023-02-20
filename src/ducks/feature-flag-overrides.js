import { DEVELOPMENT_FEATURE_FLAGS, FEATURE_FLAG_LABELS } from '../constants';
const SET_FLAG_OVERRIDE_VALUE = 'SET_FLAG_OVERRIDE_VALUE';

const { ENABLE_REPORT_NEW_UI } = FEATURE_FLAG_LABELS;

export const setFlagOverrideValue = (flagName, value) => ({
  type: SET_FLAG_OVERRIDE_VALUE,
  payload: { flagName, value }
});

export const INTIAL_REDUCER_STATE = {
  [ENABLE_REPORT_NEW_UI]: {
    label: 'New Report Form UI',
    value: DEVELOPMENT_FEATURE_FLAGS[ENABLE_REPORT_NEW_UI],
  },
};

const reducer = (state = INTIAL_REDUCER_STATE, action = {}) => {
  if (action.type === SET_FLAG_OVERRIDE_VALUE) {
    const { flagName, value } = action.payload;
    return {
      ...state,
      [flagName]: {
        ...state[flagName],
        value,
      },
    };
  }

  return state;
};

export default reducer;