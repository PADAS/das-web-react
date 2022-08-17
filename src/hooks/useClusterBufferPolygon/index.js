import React, { useCallback, useContext, useEffect, useState } from 'react';
import buffer from '@turf/buffer';
import concave from '@turf/concave';
import { featureCollection } from '@turf/helpers';
import simplify from '@turf/simplify';

import { CLUSTERS_MAX_ZOOM } from '../../constants';
import { MapContext } from '../../App';

const useClusterBufferPolygon = (layerConfiguration, layerId, sourceConfiguration, sourceId) => {
  const map = useContext(MapContext);

  const [clusterBufferPolygon] = useState(featureCollection([]));
  const source = map.getSource(sourceId);

  const renderClusterPolygon = useCallback((clusterFeatureCollection) => {
    if (source && map.getZoom() < CLUSTERS_MAX_ZOOM) {
      if (clusterFeatureCollection?.features?.length > 2) {
        try {
          const concaved = concave(clusterFeatureCollection);
          if (!concaved) return;

          const buffered = buffer(concaved, 0.2);
          const simplified = simplify(buffered, { tolerance: 0.005 });
          source.setData(simplified);
        } catch (error) {}
      } else {
        source.setData(featureCollection([]));
      }
    }
  }, [map, source]);

  const removeClusterPolygon = useCallback(() => source?.setData(featureCollection([])), [source]);

  useEffect(() => {
    if (map) {
      if (source) {
        source.setData(clusterBufferPolygon);
      } else {
        map.addSource(sourceId, { ...sourceConfiguration, data: clusterBufferPolygon });
      }

      const layer = map.getLayer(layerId);
      if (!layer) {
        map.addLayer(layerConfiguration);
      }
    }
  }, [clusterBufferPolygon, map, layerConfiguration, layerId, sourceConfiguration, source, sourceId]);

  return { removeClusterPolygon, renderClusterPolygon };
};

export default useClusterBufferPolygon;