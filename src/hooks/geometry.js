import { useMemo } from 'react';

import { calcEventGeoMeasurementDisplayStrings } from '../utils/geometry';

export const useEventGeoMeasurementDisplayStrings = (event, originalEvent) => {
  const displayStrings = useMemo(() =>
    calcEventGeoMeasurementDisplayStrings(event, originalEvent)
  , [event, originalEvent]);

  return displayStrings;
};