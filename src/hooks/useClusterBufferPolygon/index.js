import React, { useCallback, useContext, useEffect, useState } from 'react';
import buffer from '@turf/buffer';
import concave from '@turf/concave';
import { featureCollection } from '@turf/helpers';
import simplify from '@turf/simplify';

import { CLUSTERS_MAX_ZOOM } from '../../constants';
import { MapContext } from '../../App';

export default (layerConfiguration, layerId, sourceConfiguration, sourceId) => {
  const map = useContext(MapContext);

  const [clusterBufferPolygon, setClusterBufferPolygon] = useState(featureCollection([]));

  const renderClusterPolygon = useCallback((clusterFeatureCollection) => {
    const clusterGeometryIsSet = !!clusterBufferPolygon?.geometry?.coordinates?.length;
    if (!clusterGeometryIsSet && map.getZoom() < CLUSTERS_MAX_ZOOM) {
      if (clusterFeatureCollection?.features?.length > 2) {
        try {
          const concaved = concave(clusterFeatureCollection);
          if (!concaved) return;

          const buffered = buffer(concaved, 0.2);
          const simplified = simplify(buffered, { tolerance: 0.005 });
          setClusterBufferPolygon(simplified);
        } catch (error) {}
      } else {
        setClusterBufferPolygon(featureCollection([]));
      }
    }
  }, [clusterBufferPolygon, map]);

  const removeClusterPolygon = useCallback(() => setClusterBufferPolygon(featureCollection([])), []);

  useEffect(() => {
    if (map) {
      const source = map.getSource(sourceId);
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
  }, [clusterBufferPolygon, map, layerConfiguration, layerId, sourceConfiguration, sourceId]);

  return { removeClusterPolygon, renderClusterPolygon, setClusterBufferPolygon };
};
