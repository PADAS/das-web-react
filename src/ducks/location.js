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
  };
  // if (state && state.timestamp) { /* five minute expiration window for stored user location */
  //   if (((new Date() - new Date(state.timestamp)) / 1000) > 300) {
  //     return INITIAL_LOCATION_STATE;
  //   }
  // }
  return state;
};

export default globallyResettableReducer(userLocationReducer, INITIAL_LOCATION_STATE);