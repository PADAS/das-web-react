import { useMemo } from 'react';
import isEqual from 'react-fast-compare';

import { getCoordinatesForEvent } from '../utils/events';
import { calcEventGeoMeasurementDisplayStrings } from '../utils/geometry';

export const useEventGeoMeasurementDisplayStrings = (event, originalEvent) => {
  const eventCoords = getCoordinatesForEvent(event);
  const originalEventCoords = getCoordinatesForEvent(originalEvent);

  const geometryHasBeenEdited = !isEqual(eventCoords, originalEventCoords);

  const displayStrings = useMemo(() =>
    calcEventGeoMeasurementDisplayStrings(event?.geometry, geometryHasBeenEdited)
  , [event?.geometry, geometryHasBeenEdited]);

  return displayStrings;
};