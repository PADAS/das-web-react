/* ACTIONS */
import globallyResettableReducer from '../reducers/global-resettable';

export const USER_LOCATION_RETRIEVED = 'USER_LOCATION_RETRIEVED';


export const setCurrentUserLocation = location => dispatch => dispatch({
  type: USER_LOCATION_RETRIEVED,
  payload: location,
});

const INITIAL_LOCATION_STATE = null;
const userLocationReducer = (state, { type, payload }) => {
  if (type === USER_LOCATION_RETRIEVED) {
    return payload;
  }
  return state;
};

export default globallyResettableReducer(userLocationReducer, INITIAL_LOCATION_STATE);