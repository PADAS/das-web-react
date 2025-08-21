import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { OUTSIDE_BBOX, stringifyCoordinates } from '../../utils/location';
import { selectCoordinatesRepresentation } from '../../selectors/location';

const useStringifyCoordinates = (coordinates) => {
  const coordinatesRepresentation = useSelector(selectCoordinatesRepresentation);

  return useMemo(() => {
    const coordinatesString = stringifyCoordinates(coordinates, coordinatesRepresentation);
    if (coordinatesString === OUTSIDE_BBOX) {
      return { coordinatesString: stringifyCoordinates(coordinates), outsideRepresentationBbox: true };
    }
    return { coordinatesString, outsideRepresentationBbox: false };
  }, [coordinates, coordinatesRepresentation]);
};

export default useStringifyCoordinates;
