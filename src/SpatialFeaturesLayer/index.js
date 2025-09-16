import React, { memo, useContext, useMemo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MapContext } from '../App';
import { API_URL, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

const SPATIAL_FEATURES_SOURCE = 'spatial-features-source';

const VECTOR_TILE_URL = `${API_URL}spatialfeatures/tiles/{z}/{x}/{y}.pbf`;

export const SYMBOLS_LAYER_ID = 'spatial-features-symbols';
export const LINES_LAYER_ID = 'spatial-features-lines';
export const POLYGONS_LAYER_ID = 'spatial-features-polygons';

const defaultLinePaintColor = [
  'case',
  ['has', 'stroke'], ['get', 'stroke'],
  ['has', 'color'], ['get', 'color'],
  ['has', 'line_color'], ['get', 'line_color'],
  ['has', 'stroke_color'], ['get', 'stroke_color'],
  '#ff6600'
];

const defaultPolygonFillColor = [
  'case',
  ['has', 'fill'], ['get', 'fill'],
  ['has', 'color'], ['get', 'color'],
  ['has', 'fill_color'], ['get', 'fill_color'],
  ['has', 'stroke'], ['get', 'stroke'],
  '#ff6600'
];



const SpatialFeaturesLayer = ({ onFeatureClick }) => {
  const map = useContext(MapContext);
  const token = useSelector(state => state.data.token);
  const mapFeatureHighlightIDs = useSelector(state => state.view.mapFeatureHighlightIDs || []);
  const hiddenFeatureIDs = useSelector(state => state.data.mapLayerFilter?.hiddenFeatureIDs ?? []);

  const symbolLayerFilter = useMemo(() => ['all', ['==', ['geometry-type'], 'Point'], ['!', ['in', ['get', 'id'], ['literal', hiddenFeatureIDs]]]], [hiddenFeatureIDs]);
  const lineLayerFilter = useMemo(() => ['all', ['==', ['geometry-type'], 'LineString'], ['!', ['in', ['get', 'id'], ['literal', hiddenFeatureIDs]]]], [hiddenFeatureIDs]);
  const polygonLayerFilter = useMemo(() => ['all', ['==', ['geometry-type'], 'Polygon'], ['!', ['in', ['get', 'id'], ['literal', hiddenFeatureIDs]]]], [hiddenFeatureIDs]);

  const handleFeatureClick = useCallback((event) => {
    const features = map.queryRenderedFeatures(event.point, {
      layers: [SYMBOLS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID]
    });

    if (features.length > 0 && onFeatureClick) {
      onFeatureClick(features[0], event);
    }
  }, [map, onFeatureClick]);

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
        transformRequest: (url, resourceType) => {
          if (resourceType === 'Tile' && token?.access_token) {
            return {
              url,
              headers: {
                'Authorization': `Bearer ${token.access_token}`
              }
            };
          }
          return { url };
        }
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
          'text-allow-overlap': true,           // crucial for consistent visibility
          'icon-allow-overlap': true,           // crucial if icons are used
          'text-ignore-placement': true,        // recommended to avoid hiding labels
          'icon-ignore-placement': true,
          'icon-image': ['case',
            ['==', ['get', 'title'], 'Ranger Stations'], 'ranger-stations',
            ['has', 'image'], DEFAULT_SYMBOL_LAYOUT['icon-image'],
            'marker-icon',
          ],
          'text-size': 0,
          'icon-anchor': 'center',
        },
        paint: {
          ...DEFAULT_SYMBOL_PAINT
        },
        filter: symbolLayerFilter
      });
    }

    if (!map.getLayer(LINES_LAYER_ID)) {
      map.addLayer({
        id: LINES_LAYER_ID,
        type: 'line',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        paint: {
          'line-color': defaultLinePaintColor,
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
        filter: lineLayerFilter
      });
    }

    if (!map.getLayer(POLYGONS_LAYER_ID)) {
      map.addLayer({
        id: POLYGONS_LAYER_ID,
        type: 'fill',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        paint: {
          'fill-color': defaultPolygonFillColor,
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
        filter: polygonLayerFilter
      });
    }

    const layerIds = [SYMBOLS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID];

    layerIds.forEach(layerId => {
      map.on('click', layerId, handleFeatureClick);
    });

    map.on('mouseenter', SYMBOLS_LAYER_ID, onMouseEnter);
    map.on('mouseleave', SYMBOLS_LAYER_ID, onMouseLeave);

    return () => {
      layerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.off('click', layerId, handleFeatureClick);
          map.removeLayer(layerId);
        }
      });

      map.off('mouseenter', SYMBOLS_LAYER_ID, onMouseEnter);
      map.off('mouseleave', SYMBOLS_LAYER_ID, onMouseLeave);
    };
    /*
      # the filters are just used as an initializing state, not as a lifecycle dependency. 
      # this will help us support possible in-memory retention/rehydration in the future (saved app state).
    */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, handleFeatureClick, onMouseEnter, onMouseLeave, token?.access_token]);

  useEffect(() => {
    const lineLayer = map?.getLayer?.(LINES_LAYER_ID);
    const polyLayer = map?.getLayer?.(POLYGONS_LAYER_ID);

    if (lineLayer) {
      const highlightLinePaintColor = [
        ...defaultLinePaintColor.slice(0, 1),
        ['in', ['get', 'id'], ['literal', mapFeatureHighlightIDs]], 'red',
        ...defaultLinePaintColor.slice(1),
      ];

      map.setPaintProperty(lineLayer.id, 'line-color', highlightLinePaintColor);
    }

    if (polyLayer) {
      const highlightPolygonFillColor = [
        ...defaultPolygonFillColor.slice(0, 1),
        ['in', ['get', 'id'], ['literal', mapFeatureHighlightIDs]], 'red',
        ...defaultPolygonFillColor.slice(1),
      ];

      map.setPaintProperty(polyLayer.id, 'fill-color', highlightPolygonFillColor);
    }

  }, [map, mapFeatureHighlightIDs]);

  useEffect(() => {
    const symbolLayer = map?.getLayer?.(SYMBOLS_LAYER_ID);
    if (symbolLayer) {
      map.setFilter(symbolLayer.id, symbolLayerFilter);
    }
  }, [map, symbolLayerFilter]);

  useEffect(() => {
    const lineLayer = map?.getLayer?.(LINES_LAYER_ID);
    if (lineLayer) {
      map.setFilter(lineLayer.id, lineLayerFilter);
    }
  }, [map, lineLayerFilter]);

  useEffect(() => {
    const polygonLayer = map?.getLayer?.(POLYGONS_LAYER_ID);
    if (polygonLayer) {
      map.setFilter(polygonLayer.id, polygonLayerFilter);
    }
  }, [map, polygonLayerFilter]);

  return null;
};

export default memo(SpatialFeaturesLayer);
