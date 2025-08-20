import { createSelector } from 'reselect';

const selectGpsFormat = (state) => state.view.userPreferences.gpsFormat;
const selectStoredCoordinateReferenceSystems = (state) => state.view.coordinateReferenceSystems.storedSystems;

export const selectCoordinatesRepresentation = createSelector(
  [selectGpsFormat, selectStoredCoordinateReferenceSystems],
  (gpsFormat, storedCoordinateReferenceSystems) => {
    const gpsFormatCoordinateReferenceSystem = storedCoordinateReferenceSystems.find(
      (coordinateReferenceSystem) => coordinateReferenceSystem.code === gpsFormat
    );

    return gpsFormatCoordinateReferenceSystem || gpsFormat;
  }
);

export const selectStoredCoordinateReferenceSystemsMappedByCode = createSelector(
  [selectStoredCoordinateReferenceSystems],
  (storedCoordinateReferenceSystems) => storedCoordinateReferenceSystems.reduce(
    (accumulator, coordinateReferenceSystem) => {
      accumulator[coordinateReferenceSystem.code] = coordinateReferenceSystem;
      return accumulator;
    }, {}
  )
);
