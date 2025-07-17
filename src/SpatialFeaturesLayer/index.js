import React, { memo, useContext, useCallback, useEffect } from 'react';
import { MapContext } from '../App';
import { API_URL, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

const SPATIAL_FEATURES_SOURCE = 'spatial-features-source';

const VECTOR_TILE_URL = `${API_URL}spatialfeatures/tiles/{z}/{x}/{y}.pbf`;

const SpatialFeaturesLayer = ({ onFeatureClick }) => {
  const map = useContext(MapContext);

  const SYMBOLS_LAYER_ID = 'spatial-features-symbols';
  const LINES_LAYER_ID = 'spatial-features-lines';
  const POLYGONS_LAYER_ID = 'spatial-features-polygons';

  const handleFeatureClick = useCallback((event) => {
    const features = map.queryRenderedFeatures(event.point, {
      layers: [SYMBOLS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID]
    });

    if (features.length > 0 && onFeatureClick) {
      onFeatureClick(features[0]);
    }
  }, [map, onFeatureClick, SYMBOLS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID]);

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

    if (!map.getLayer(SYMBOLS_LAYER_ID)) {
      map.addLayer({
        id: SYMBOLS_LAYER_ID,
        type: 'symbol',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        layout: {
          ...DEFAULT_SYMBOL_LAYOUT,
          'icon-image': [
            'case',
            ['has', 'image'], ['get', 'image'],
            'marker-icon'
          ],
          'icon-anchor': 'center',
          'text-field': [
            'case',
            ['has', 'title'], ['get', 'title'],
            ['has', 'name'], ['get', 'name'],
            ''
          ]
        },
        paint: {
          ...DEFAULT_SYMBOL_PAINT
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
          'line-color': [
            'case',
            ['has', 'stroke'], ['get', 'stroke'],
            ['has', 'color'], ['get', 'color'],
            ['has', 'line_color'], ['get', 'line_color'],
            ['has', 'stroke_color'], ['get', 'stroke_color'],
            '#ff6600'
          ],
          'line-width': [
            'case',
            ['has', 'stroke-width'], ['get', 'stroke-width'],
            ['has', 'width'], ['get', 'width'],
            ['has', 'line_width'], ['get', 'line_width'],
            ['has', 'stroke_width'], ['get', 'stroke_width'],
            3
          ],
          'line-opacity': [
            'case',
            ['has', 'stroke-opacity'], ['get', 'stroke-opacity'],
            ['has', 'opacity'], ['get', 'opacity'],
            ['has', 'line_opacity'], ['get', 'line_opacity'],
            ['has', 'stroke_opacity'], ['get', 'stroke_opacity'],
            1
          ]
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
          'fill-color': [
            'case',
            ['has', 'fill'], ['get', 'fill'],
            ['has', 'color'], ['get', 'color'],
            ['has', 'fill_color'], ['get', 'fill_color'],
            ['has', 'stroke'], ['get', 'stroke'],
            '#ff6600'
          ],
          'fill-opacity': [
            'case',
            ['has', 'fill-opacity'], ['get', 'fill-opacity'],
            ['has', 'opacity'], ['get', 'opacity'],
            ['has', 'fill_opacity'], ['get', 'fill_opacity'],
            0.4
          ],
          'fill-outline-color': [
            'case',
            ['has', 'stroke'], ['get', 'stroke'],
            ['has', 'outline_color'], ['get', 'outline_color'],
            ['has', 'border_color'], ['get', 'border_color'],
            '#ff6600'
          ]
        },
        filter: ['==', ['geometry-type'], 'Polygon']
      });
    }

    const layerIds = [SYMBOLS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID];

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

      if (map.getSource(SPATIAL_FEATURES_SOURCE)) {
        map.removeSource(SPATIAL_FEATURES_SOURCE);
      }
    };
  }, [map, handleFeatureClick, onMouseEnter, onMouseLeave, SYMBOLS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID]);

  return null;
};

export default memo(SpatialFeaturesLayer);
