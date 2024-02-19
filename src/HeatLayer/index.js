import { memo, useMemo, useRef } from 'react';
import centroid from '@turf/centroid';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { LAYER_IDS, MAX_ZOOM } from '../constants';
import { metersToPixelsAtMaxZoom } from '../utils/map';
import { uuid } from '../utils/string';
import { useMapLayer, useMapSource } from '../hooks';

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

  useMapSource(`heatmap-source-${idRef.current}`, points);
  useMapLayer(`${HEATMAP_LAYER}-${idRef.current}`, 'heatmap', `heatmap-source-${idRef.current}`, paint, null, { before: SKY_LAYER });

  return null;
};

HeatLayer.propTypes = {
  points: PropTypes.object.isRequired,
};

export default memo(HeatLayer);
