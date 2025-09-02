import { GPS_FORMATS } from '../../utils/location';

export const MAX_STORED_COORDINATE_REFERENCE_SYSTEMS = 6;
const MAX_SELECTED_COORDINATE_REPRESENTATIONS = 5;

// Actions
export const SET_SELECTED_COORDINATE_REPRESENTATIONS = 'COORDINATE_SYSTEM.SET_SELECTED_COORDINATE_REPRESENTATIONS';
export const SET_STORED_COORDINATE_REFERENCE_SYSTEMS = 'COORDINATE_SYSTEM.SET_STORED_COORDINATE_REFERENCE_SYSTEMS';

// Action creators
export const setSelectedCoordinateRepresentations = (selectedCoordinateRepresentations) => ({
  payload: selectedCoordinateRepresentations,
  type: SET_SELECTED_COORDINATE_REPRESENTATIONS,
});

export const setStoredCoordinateReferenceSystems = (storedCoordinateReferenceSystems) => ({
  payload: storedCoordinateReferenceSystems,
  type: SET_STORED_COORDINATE_REFERENCE_SYSTEMS,
});

// Reducer
export const INITIAL_STATE = {
  selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
  storedSystems: [],
};

const coordinateReferenceSystemsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case SET_SELECTED_COORDINATE_REPRESENTATIONS:
    // Make sure DEG is always selected and that the list never has more than
    // the maximum allowed selected coordinate representations.
    const selectedCoordinateRepresentations = [...action.payload];
    if (!selectedCoordinateRepresentations.includes(GPS_FORMATS.DEG)) {
      selectedCoordinateRepresentations.unshift(GPS_FORMATS.DEG);
    }

    return {
      ...state,
      selectedCoordinateRepresentations: selectedCoordinateRepresentations.slice(0, MAX_SELECTED_COORDINATE_REPRESENTATIONS),
    };

  case SET_STORED_COORDINATE_REFERENCE_SYSTEMS:
    // Sort the stored coordinate reference systems by their EPSG code and make
    // sure that the list never has more than the maximum allowed stored CRS.
    return {
      ...state,
      storedSystems: [...action.payload]
        .slice(0, MAX_STORED_COORDINATE_REFERENCE_SYSTEMS)
        .sort((crsA, crsB) => crsA.code - crsB.code),
    };

  default:
    return state;
  }
};

export default coordinateReferenceSystemsReducer;
