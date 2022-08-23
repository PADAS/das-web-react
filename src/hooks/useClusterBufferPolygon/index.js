import React, { useCallback, useContext, useState } from 'react';
import buffer from '@turf/buffer';
import concave from '@turf/concave';
import { featureCollection } from '@turf/helpers';
import simplify from '@turf/simplify';

import { CLUSTERS_MAX_ZOOM, LAYER_IDS, SOURCE_IDS } from '../../constants';
import { MapContext } from '../../App';
import { useMapLayer, useMapSource } from '..';

const { CLUSTER_BUFFER_POLYGON_LAYER_ID, CLUSTERS_LAYER_ID } = LAYER_IDS;
const { CLUSTER_BUFFER_POLYGON_SOURCE_ID } = SOURCE_IDS;

const CLUSTER_BUFFER_POLYGON_LAYER_CONFIGURATION = {
  before: CLUSTERS_LAYER_ID,
  maxZoom: CLUSTERS_MAX_ZOOM - 1,
};

const CLUSTER_BUFFER_POLYGON_PAINT = {
  'fill-color': 'rgba(60, 120, 40, 0.4)',
  'fill-outline-color': 'rgba(20, 100, 25, 1)',
};

const useClusterBufferPolygon = () => {
  const [clusterBufferPolygon, setClusterBufferPolygon] = useState(featureCollection([]));

  const map = useContext(MapContext);
  const source = useMapSource(CLUSTER_BUFFER_POLYGON_SOURCE_ID, clusterBufferPolygon);

  useMapLayer(CLUSTER_BUFFER_POLYGON_LAYER_ID, 'fill', CLUSTER_BUFFER_POLYGON_SOURCE_ID, CLUSTER_BUFFER_POLYGON_PAINT, null, CLUSTER_BUFFER_POLYGON_LAYER_CONFIGURATION);

  const renderClusterPolygon = useCallback((clusterFeatureCollection) => {
    if (source && map.getZoom() < CLUSTERS_MAX_ZOOM) {
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
  }, [map, source]);

  const removeClusterPolygon = useCallback(() => source?.setData(featureCollection([])), [source]);

  return { removeClusterPolygon, renderClusterPolygon };
};

export default useClusterBufferPolygon;