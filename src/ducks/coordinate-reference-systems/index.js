import { GPS_FORMATS } from '../../utils/location';

const MAX_SELECTED_COORDINATE_REFERENCE_SYSTEMS = 5;

// Actions
export const SET_SELECTED_COORDINATE_REFERENCE_SYSTEMS = 'COORDINATE_SYSTEM.SET_SELECTED_COORDINATE_REFERENCE_SYSTEMS';
export const SET_STORED_COORDINATE_REFERENCE_SYSTEMS = 'COORDINATE_SYSTEM.SET_STORED_COORDINATE_REFERENCE_SYSTEMS';

// Action creators
export const setSelectedCoordinateReferenceSystems = (selectedCoordinateReferenceSystems) => ({
  type: SET_SELECTED_COORDINATE_REFERENCE_SYSTEMS,
  payload: selectedCoordinateReferenceSystems,
});

export const setStoredCoordinateReferenceSystems = (storedCoordinateReferenceSystems) => ({
  type: SET_STORED_COORDINATE_REFERENCE_SYSTEMS,
  payload: storedCoordinateReferenceSystems,
});

// Reducer
export const INITIAL_STATE = {
  selectedSystems: Object.values(GPS_FORMATS),
  storedSystems: [],
};

const coordinateReferenceSystemsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case SET_SELECTED_COORDINATE_REFERENCE_SYSTEMS:
    // Make sure DEG is always selected and that the list never has more than
    // the maximum allowed selected coordinate reference systems.
    const selectedSystems = [...action.payload];
    if (!selectedSystems.includes(GPS_FORMATS.DEG)) {
      selectedSystems.unshift(GPS_FORMATS.DEG);
    }

    return { ...state, selectedSystems: selectedSystems.slice(0, MAX_SELECTED_COORDINATE_REFERENCE_SYSTEMS) };

  case SET_STORED_COORDINATE_REFERENCE_SYSTEMS:
    // Sort the stored coordinate reference systems by their EPSG code.
    return {
      ...state,
      storedSystems: [...action.payload].sort((crsA, crsB) => crsA.code - crsB.code),
    };

  default:
    return state;
  }
};

export default coordinateReferenceSystemsReducer;
