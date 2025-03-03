import { memo, useMemo, useRef } from 'react';
import { centroid } from '@turf/turf';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { LAYER_IDS, MAX_ZOOM } from '../constants';
import { metersToPixelsAtMaxZoom } from '../utils/map';
import { uuid } from '../utils/string';
import useMapSource from '../hooks/useMapSource';
import useMapLayer from '../hooks/useMapLayer';

const { HEATMAP_LAYER, SKY_LAYER } = LAYER_IDS;

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

  useMapSource({ id: `heatmap-source-${idRef.current}`, data: points });
  useMapLayer(
    {
      id: `${HEATMAP_LAYER}-${idRef.current}`,
      type: 'heatmap',
      sourceId: `heatmap-source-${idRef.current}`,
      paint,
      before: SKY_LAYER
    }
  );

  return null;
};

HeatLayer.propTypes = {
  points: PropTypes.object.isRequired,
};

export default memo(HeatLayer);
