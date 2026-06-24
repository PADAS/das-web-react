import { memo, useMemo, useState } from 'react';
import { centroid } from '@turf/turf';
import { useSelector } from 'react-redux';

import { LAYER_IDS, MAX_ZOOM } from '../constants';
import { metersToPixelsAtMaxZoom } from '../utils/map';
import { uuid } from '../utils/string';
import useMapSources from '../hooks/useMapSources';
import useMapLayers from '../hooks/useMapLayers';

const { HEATMAP_LAYER, EVENT_SYMBOLS } = LAYER_IDS;

const HeatLayer = ({ beforeLayerId = EVENT_SYMBOLS, points }) => {
  const heatmapStyles = useSelector((state) => state.view.heatmapStyles);

  // Stable per-instance id for this heatmap's source/layer.
  const [instanceId] = useState(uuid);

  const paint = useMemo(() => {
    const centroidPoint = centroid(points);

    return {
      'heatmap-radius': {
        'stops': [
          [0, 1],
          [MAX_ZOOM, metersToPixelsAtMaxZoom(heatmapStyles.radiusInMeters, centroidPoint.geometry.coordinates[1])],
        ],
        'base': 2,
      },
      'heatmap-weight': heatmapStyles.intensity,
    };
  }, [heatmapStyles.intensity, heatmapStyles.radiusInMeters, points]);

  useMapSources([{ id: `heatmap-source-${instanceId}`, data: points }]);
  useMapLayers([{
    id: `${HEATMAP_LAYER}-${instanceId}`,
    type: 'heatmap',
    sourceId: `heatmap-source-${instanceId}`,
    paint,
    options: {
      before: beforeLayerId,
      beforeOptional: true,
    }
  }]);

  return null;
};

export default memo(HeatLayer);
