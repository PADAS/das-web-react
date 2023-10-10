import { DEVELOPMENT_FEATURE_FLAGS, FEATURE_FLAG_LABELS } from '../constants';
const SET_FLAG_OVERRIDE_VALUE = 'SET_FLAG_OVERRIDE_VALUE';

const { ENABLE_PATROL_NEW_UI } = FEATURE_FLAG_LABELS;

export const ENABLE_NEW_REPORT_NOTIFICATION_SOUND = 'ENABLE_NEW_REPORT_NOTIFICATION_SOUND';

export const migrations = {
  0: (state) => {
    const { ENABLE_REPORT_NEW_UI: _removedKey, ...rest } = state;
    return rest;
  }
};

export const setFlagOverrideValue = (flagName, value) => ({
  type: SET_FLAG_OVERRIDE_VALUE,
  payload: { flagName, value }
});

export const INTIAL_REDUCER_STATE = {
  [ENABLE_PATROL_NEW_UI]: {
    label: 'New Patrol Form UI',
    value: DEVELOPMENT_FEATURE_FLAGS[ENABLE_PATROL_NEW_UI],
  },
  [ENABLE_NEW_REPORT_NOTIFICATION_SOUND]: {
    label: 'Play Sound For New Reports',
    value: false,
  }
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