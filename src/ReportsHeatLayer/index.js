import React, { memo, useMemo } from 'react';
import { featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';

import { LAYER_IDS, PREVIEW_FEATURES } from '../constants';
import { getMapEventSymbolPointsWithVirtualDate } from '../selectors/events';
import { isFeatureVisibleAtVirtualDate, resolveEventTimeSliderParameters } from '../utils/event-vector-tiles';
import { selectRealtimeOverlayFeatureCollection } from '../selectors/events-realtime-overlay';
import { usePreviewFeature } from '../hooks';
import useTileEventFeatures from '../hooks/useTileEventFeatures';

import HeatLayer from '../HeatLayer';

const ReportsHeatLayer = () => {
  const eventVectorTilesEnabled = usePreviewFeature(PREVIEW_FEATURES.EVENTS_VECTOR_TILES);

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
    if (eventVectorTilesEnabled) {
      // Heat points come from the tile features plus the overlay features.
      const overlayFeatures = realtimeOverlayFeatureCollection.features
        .filter((feature) => isFeatureVisibleAtVirtualDate(feature, timeSliderParameters));

      return featureCollection([...tileEventFeatures.features, ...overlayFeatures]);
    } else {
      return mapEventSymbolPointsWithVirtualDate;
    }
  }, [eventVectorTilesEnabled, mapEventSymbolPointsWithVirtualDate, realtimeOverlayFeatureCollection, tileEventFeatures, timeSliderParameters]);

  // Sit the heatmap just beneath whichever event symbol layer is mounted.
  const beforeLayerId = eventVectorTilesEnabled ? LAYER_IDS.EVENTS_VECTOR_SYMBOLS : LAYER_IDS.EVENT_SYMBOLS;

  return reports?.features?.length ? <HeatLayer points={reports} beforeLayerId={beforeLayerId} /> : null;
};

export default memo(ReportsHeatLayer);
