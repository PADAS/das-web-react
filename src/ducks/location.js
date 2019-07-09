/* ACTIONS */
export const USER_LOCATION_RETRIEVED = 'USER_LOCATION_RETRIEVED';


export const setCurrentUserLocation = location => dispatch => dispatch({
  type: USER_LOCATION_RETRIEVED,
  payload: location,
});

const INITIAL_LOCATION_STATE = null;
const userLocationReducer = (state = INITIAL_LOCATION_STATE, { type, payload }) => {
  if (type === USER_LOCATION_RETRIEVED) {
    console.log('USER_LOCATION_RETRIEVED', USER_LOCATION_RETRIEVED);
    return payload;
  };
  if (state && state.timestamp) { /* five minute expiration window for stored user location */
    if (((new Date() - new Date(state.timestamp)) / 1000) > 300) {
      return INITIAL_LOCATION_STATE;
    }
  }
  return state;
};

export default userLocationReducer;