import { memo, useMemo, useRef } from 'react';
import { centroid } from '@turf/turf';
import { useSelector } from 'react-redux';

import { LAYER_IDS, MAX_ZOOM } from '../constants';
import { metersToPixelsAtMaxZoom } from '../utils/map';
import { uuid } from '../utils/string';
import useMapSources from '../hooks/useMapSources';
import useMapLayers from '../hooks/useMapLayers';

const { HEATMAP_LAYER, EVENT_SYMBOLS } = LAYER_IDS;

const HeatLayer = ({ points }) => {
  const heatmapStyles = useSelector((state) => state.view.heatmapStyles);

  const idRef = useRef(uuid());

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

  useMapSources([{ id: `heatmap-source-${idRef.current}`, data: points }]);
  useMapLayers([{
    id: `${HEATMAP_LAYER}-${idRef.current}`,
    type: 'heatmap',
    sourceId: `heatmap-source-${idRef.current}`,
    paint,
    options: {
      before: EVENT_SYMBOLS,
    }
  }]);

  return null;
};

export default memo(HeatLayer);
