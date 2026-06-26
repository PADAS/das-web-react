import React, { memo, useMemo } from 'react';
import { featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';

import { FEATURE_FLAGS, LAYER_IDS } from '../constants';
import { getMapEventSymbolPointsWithVirtualDate } from '../selectors/events';
import { isFeatureVisibleAtVirtualDate, resolveEventTimeSliderParameters } from '../utils/event-vector-tiles';
import { selectRealtimeOverlayFeatureCollection } from '../selectors/events-realtime-overlay';
import { useFeatureFlag } from '../hooks';
import useTileEventFeatures from '../hooks/useTileEventFeatures';

import HeatLayer from '../HeatLayer';

const ReportsHeatLayer = () => {
  const useEventVectorTiles = useFeatureFlag(FEATURE_FLAGS.EVENTS_VECTOR_TILES);

  const eventFilterDateRange = useSelector((state) => state.data.eventFilter?.filter?.date_range);
  const mapEventSymbolPointsWithVirtualDate = useSelector(getMapEventSymbolPointsWithVirtualDate);
  const realtimeOverlayFeatureCollection = useSelector(selectRealtimeOverlayFeatureCollection);
  const timeSliderState = useSelector((state) => state.view.timeSliderState);

  const tileEventFeatures = useTileEventFeatures();

  const timeSliderParameters = useMemo(
    () => resolveEventTimeSliderParameters(timeSliderState, eventFilterDateRange),
    [timeSliderState, eventFilterDateRange]
  );

  const reports = useMemo(() => {
    if (useEventVectorTiles) {
      const overlayFeatures = realtimeOverlayFeatureCollection.features
        .filter((feature) => isFeatureVisibleAtVirtualDate(feature, timeSliderParameters));

      return featureCollection([...tileEventFeatures.features, ...overlayFeatures]);
    } else {
      return mapEventSymbolPointsWithVirtualDate;
    }
  }, [useEventVectorTiles, mapEventSymbolPointsWithVirtualDate, realtimeOverlayFeatureCollection, tileEventFeatures, timeSliderParameters]);

  const beforeLayerId = useEventVectorTiles ? LAYER_IDS.EVENTS_VECTOR_SYMBOLS : LAYER_IDS.EVENT_SYMBOLS;

  return reports?.features?.length ? <HeatLayer points={reports} beforeLayerId={beforeLayerId} /> : null;
};

export default memo(ReportsHeatLayer);
