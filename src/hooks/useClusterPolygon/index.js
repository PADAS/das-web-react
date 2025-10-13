import { useCallback, useContext, useEffect, useRef } from 'react';
import { buffer, concave, featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';

import { CLUSTERS_MAX_ZOOM, LAYER_IDS, SOURCE_IDS } from '../../constants';
import { MapContext } from '../../App';

const ZOOM_FACTOR_BASE_DISTANCE = 0.75;
const ZOOM_FACTOR_BASE_ZOOM = 10;

const useClusterPolygon = () => {
  const showMapClusterPolygons = useSelector((state) => state.view.mapClusterConfig.showPolygons);

  const map = useContext(MapContext);

  // We use a ref that holds the value of showMapClusterPolygons so
  // renderClusterPolygon can read its latest value immediately without
  // depending on the callback being refreshed and re-attached to listeners or
  // anything the implementator does.
  const showMapClusterPolygonsRef = useRef(showMapClusterPolygons);

  const addClusterPolygon = useCallback((clusterFeatureCollection) => {
    const clusterPolygonSource = map?.getSource(SOURCE_IDS.CLUSTER_POLYGON_SOURCE_ID);
    const mapZoom = map.getZoom();

    if (showMapClusterPolygonsRef.current && clusterPolygonSource && mapZoom <= CLUSTERS_MAX_ZOOM) {
      // If the show map cluster polygon setting is on, the map source is
      // defined and the map zoom within the threshold, calculate the concave
      // polygon surrounding the cluster features.
      const concaveClusterPolygon = concave(clusterFeatureCollection);
      if (concaveClusterPolygon) {
        // If the concave polygon is valid, calculate a zoom factor to get a
        // sensible buffer distance depending on the current zoom.
        const zoomFactor = Math.pow(2, ZOOM_FACTOR_BASE_ZOOM - mapZoom);

        // Buffer the concave polygon by 750 meters at zoom 10 and escalate
        // proportionally using the zoom factor.
        clusterPolygonSource.setData(buffer(concaveClusterPolygon, ZOOM_FACTOR_BASE_DISTANCE * zoomFactor));
      }
    }
  }, [map]);

  const removeClusterPolygon = useCallback(() => {
    const clusterPolygonSource = map?.getSource(SOURCE_IDS.CLUSTER_POLYGON_SOURCE_ID);
    if (clusterPolygonSource) {
      clusterPolygonSource.setData(featureCollection([]));
    }
  }, [map]);

  useEffect(() => {
    // Keep the ref updated with any changes to the show polygons map cluster
    // setting.
    showMapClusterPolygonsRef.current = showMapClusterPolygons;
  }, [showMapClusterPolygons]);

  useEffect(() => {
    if (map && showMapClusterPolygons) {
      if (!map.getSource(SOURCE_IDS.CLUSTER_POLYGON_SOURCE_ID)) {
        // Add cluster polygon source.
        map.addSource(SOURCE_IDS.CLUSTER_POLYGON_SOURCE_ID, { data: featureCollection([]), type: 'geojson' });
      }

      if (!map.getLayer(LAYER_IDS.CLUSTER_POLYGON_LAYER_ID)) {
        // Add cluster polygon layer.
        map.addLayer({
          id: LAYER_IDS.CLUSTER_POLYGON_LAYER_ID,
          maxzoom: CLUSTERS_MAX_ZOOM - 1,
          paint: {
            'fill-color': 'rgba(60, 120, 40, 0.4)',
            'fill-outline-color': 'rgba(20, 100, 25, 1)',
          },
          source: SOURCE_IDS.CLUSTER_POLYGON_SOURCE_ID,
          type: 'fill',
        }, LAYER_IDS.CLUSTERS_LAYER_ID);
      }

      return () => {
        // Clean map resources when the hook unmounts.
        try {
          if (map && map.getLayer && map.removeLayer && map.getLayer(LAYER_IDS.CLUSTER_POLYGON_LAYER_ID)) {
            map.removeLayer(LAYER_IDS.CLUSTER_POLYGON_LAYER_ID);
          }
          if (map && map.getSource && map.removeSource && map.getSource(SOURCE_IDS.CLUSTER_POLYGON_SOURCE_ID)) {
            map.removeSource(SOURCE_IDS.CLUSTER_POLYGON_SOURCE_ID);
          }
        } catch (error) {
          // Silently handle cleanup errors that occur during unmounting
          console.warn('Error cleaning up cluster polygon:', error);
        }
      };
    }
  }, [map, showMapClusterPolygons]);

  return { addClusterPolygon, removeClusterPolygon };
};

export default useClusterPolygon;
