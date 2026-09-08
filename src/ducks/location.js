/* ACTIONS */
import globallyResettableReducer from '../reducers/global-resettable';

export const USER_LOCATION_RETRIEVED = 'USER_LOCATION_RETRIEVED';


export const setCurrentUserLocation = (location) => (dispatch) => dispatch({
  // A position keeps the timestamp of its fix, which the watcher re-dispatches unchanged on a stationary
  // device, so freshness has to come from when the store received it.
  payload: location ? { coords: location.coords, receivedAt: Date.now(), timestamp: location.timestamp } : location,
  type: USER_LOCATION_RETRIEVED,
});

const INITIAL_LOCATION_STATE = null;
const userLocationReducer = (state, { type, payload }) => {
  if (type === USER_LOCATION_RETRIEVED) {
    return payload;
  }
  return state;
};

export default globallyResettableReducer(userLocationReducer, INITIAL_LOCATION_STATE);