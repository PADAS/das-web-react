import React, { memo, useContext, useCallback, useEffect } from 'react';
import { MapContext } from '../App';

const SPATIAL_FEATURES_SOURCE = 'spatial-features-source';

const VECTOR_TILE_URL = `${process.env.REACT_APP_DAS_HOST}/api/v1.0/spatialfeatures/tiles/{z}/{x}/{y}.pbf`;

const SpatialFeaturesLayer = ({ onFeatureClick }) => {
  const map = useContext(MapContext);

  const POINTS_LAYER_ID = 'spatial-features-points';
  const LINES_LAYER_ID = 'spatial-features-lines';
  const POLYGONS_LAYER_ID = 'spatial-features-polygons';

  const handleFeatureClick = useCallback((event) => {
    const features = map.queryRenderedFeatures(event.point, {
      layers: [POINTS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID]
    });

    if (features.length > 0 && onFeatureClick) {
      onFeatureClick(features[0]);
    }
  }, [map, onFeatureClick, POINTS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID]);

  const onMouseEnter = useCallback(() => {
    map.getCanvas().style.cursor = 'pointer';
  }, [map]);

  const onMouseLeave = useCallback(() => {
    map.getCanvas().style.cursor = '';
  }, [map]);

  useEffect(() => {
    if (!map) return;

    if (!map.getSource(SPATIAL_FEATURES_SOURCE)) {
      map.addSource(SPATIAL_FEATURES_SOURCE, {
        type: 'vector',
        tiles: [VECTOR_TILE_URL],
        minzoom: 0,
        maxzoom: 22,
      });
    }

    if (!map.getLayer(POINTS_LAYER_ID)) {
      map.addLayer({
        id: POINTS_LAYER_ID,
        type: 'circle',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        paint: {
          'circle-radius': 10,
          'circle-color': '#000000',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        },
        filter: ['==', ['geometry-type'], 'Point']
      });
    }

    if (!map.getLayer(LINES_LAYER_ID)) {
      map.addLayer({
        id: LINES_LAYER_ID,
        type: 'line',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        paint: {
          'line-color': '#000000',
          'line-width': 4
        },
        filter: ['==', ['geometry-type'], 'LineString']
      });
    }

    if (!map.getLayer(POLYGONS_LAYER_ID)) {
      map.addLayer({
        id: POLYGONS_LAYER_ID,
        type: 'fill',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        paint: {
          'fill-color': '#000000',
          'fill-opacity': 0.3,
          'fill-outline-color': '#000000'
        },
        filter: ['==', ['geometry-type'], 'Polygon']
      });
    }

    const layerIds = [POINTS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID];

    layerIds.forEach(layerId => {
      map.on('click', layerId, handleFeatureClick);
      map.on('mouseenter', layerId, onMouseEnter);
      map.on('mouseleave', layerId, onMouseLeave);
    });

    return () => {
      layerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.off('click', layerId, handleFeatureClick);
          map.off('mouseenter', layerId, onMouseEnter);
          map.off('mouseleave', layerId, onMouseLeave);
          map.removeLayer(layerId);
        }
      });
    };
  }, [map, handleFeatureClick, onMouseEnter, onMouseLeave, POINTS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID]);

  return null;
};

export default memo(SpatialFeaturesLayer);
