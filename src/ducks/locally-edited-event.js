import { point, polygon } from '@turf/helpers';

// actions
const SET_LOCALLY_EDITED_EVENT = 'SET_LOCALLY_EDITED_EVENT';
const UNSET_LOCALLY_EDITED_EVENT = 'UNSET_LOCALLY_EDITED_EVENT';

// action creators
export const setLocallyEditedEvent = (event) => (dispatch) => {
  const payload = { ...event };

  if (payload?.location) {
    payload.geojson = point([payload.location.longitude, payload.location.latitude]);
  }

  const payloadGeometry = payload?.geometry?.type === 'FeatureCollection'
    ? payload.geometry.features[0]
    : payload?.geometry;
  if (payloadGeometry) {
    payload.geojson = polygon(payloadGeometry.geometry.coordinates);
  }

  if (payload.geojson) {
    payload.geojson.properties = { locallyEdited: true };
  }

  dispatch({ type: SET_LOCALLY_EDITED_EVENT, payload });
};

export const unsetLocallyEditedEvent = () => (dispatch) => dispatch({
  type: UNSET_LOCALLY_EDITED_EVENT,
});

// reducer
const INITIAL_STATE = null;

export const locallyEditedEventReducer = (state = INITIAL_STATE, action = {}) => {
  switch (action.type) {
  case SET_LOCALLY_EDITED_EVENT:
    return action.payload;

  case UNSET_LOCALLY_EDITED_EVENT:
    return INITIAL_STATE;

  default:
    return state;
  }
};

export default locallyEditedEventReducer;
