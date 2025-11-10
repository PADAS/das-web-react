import React, { memo, useContext, useMemo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MapContext } from '../App';
import { API_URL, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

const OBSERVATIONS_SOURCE = 'observations-source';
const VECTOR_TILE_URL = `${API_URL}observations/tiles/{z}/{x}/{y}.pbf`;

export const SYMBOLS_LAYER_ID = 'observations-symbols';
export const LINES_LAYER_ID = 'observations-lines';
export const POLYGONS_LAYER_ID = 'observations-polygons';

const DEFAULT_LINE_PAINT_COLOR = [
  'case',
  ['has', 'stroke'], ['get', 'stroke'],
  ['has', 'color'], ['get', 'color'],
  ['has', 'line_color'], ['get', 'line_color'],
  ['has', 'stroke_color'], ['get', 'stroke_color'],
  '#ff6600'
];

const DEFAULT_POLYGON_FILL_COLOR = [
  'case',
  ['has', 'fill'], ['get', 'fill'],
  ['has', 'color'], ['get', 'color'],
  ['has', 'fill_color'], ['get', 'fill_color'],
  ['has', 'stroke'], ['get', 'stroke'],
  '#ff6600'
];

const ObservationsLayer = ({ onFeatureClick = () => null, parameters = {
  since: '2025-10-01T15:46:10.907Z',
  until: null,
} }) => {
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
      features.forEach((feature) => {
        onFeatureClick(feature, event);
      });
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

    if (!map.getSource(OBSERVATIONS_SOURCE)) {
      map.addSource(OBSERVATIONS_SOURCE, {
        type: 'vector',
        tiles: [VECTOR_TILE_URL],
        minzoom: 0,
        maxzoom: 22,
        transformRequest: (url, resourceType) => {
          const reqConfig = {
            url,
            headers: {},
          };

          if (resourceType === 'Tile') {
            const params = new URLSearchParams(parameters).toString();

            if (params) {
              reqConfig.url += (reqConfig.url.includes('?') ? '&' : '?') + params;
            }
            if (token?.access_token) {
              reqConfig.headers['Authorization'] = `Bearer ${token.access_token}`;
            }
          }

          return reqConfig;
        }
      });
    }

    if (!map.getLayer(SYMBOLS_LAYER_ID)) {
      map.addLayer({
        id: SYMBOLS_LAYER_ID,
        type: 'symbol',
        source: OBSERVATIONS_SOURCE,
        'source-layer': 'observations',
        layout: {
          ...DEFAULT_SYMBOL_LAYOUT,
          'text-allow-overlap': true,
          'icon-allow-overlap': true,
          'text-ignore-placement': true,
          'icon-ignore-placement': true,
          'icon-image': ['case',
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
        source: OBSERVATIONS_SOURCE,
        'source-layer': 'observations',
        paint: {
          'line-color': DEFAULT_LINE_PAINT_COLOR,
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
        source: OBSERVATIONS_SOURCE,
        'source-layer': 'observations',
        paint: {
          'fill-color': DEFAULT_POLYGON_FILL_COLOR,
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

    const layerIds = [
      SYMBOLS_LAYER_ID,
      LINES_LAYER_ID,
      POLYGONS_LAYER_ID,
    ];

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
      map.removeSource(OBSERVATIONS_SOURCE);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, handleFeatureClick, onMouseEnter, onMouseLeave, token?.access_token, parameters]);

  useEffect(() => {
    const lineLayer = map?.getLayer?.(LINES_LAYER_ID);
    const polyLayer = map?.getLayer?.(POLYGONS_LAYER_ID);
    if (lineLayer) {
      const highlightLinePaintColor = [
        ...DEFAULT_LINE_PAINT_COLOR.slice(0, 1),
        ['in', ['get', 'id'], ['literal', mapFeatureHighlightIDs]], 'red',
        ...DEFAULT_LINE_PAINT_COLOR.slice(1),
      ];
      map.setPaintProperty(lineLayer.id, 'line-color', highlightLinePaintColor);
    }
    if (polyLayer) {
      const highlightPolygonFillColor = [
        ...DEFAULT_POLYGON_FILL_COLOR.slice(0, 1),
        ['in', ['get', 'id'], ['literal', mapFeatureHighlightIDs]], 'red',
        ...DEFAULT_POLYGON_FILL_COLOR.slice(1),
      ];
      map.setPaintProperty(polyLayer.id, 'fill-color', highlightPolygonFillColor);
    }
  }, [map, mapFeatureHighlightIDs]);

  useEffect(() => {
    const symbolLayers = [
      map?.getLayer?.(SYMBOLS_LAYER_ID),
    ].filter(Boolean);
    if (symbolLayers.length) {
      symbolLayers.forEach((layer) => {
        map.setFilter(layer.id, symbolLayerFilter);
      });
    }
  }, [map, symbolLayerFilter]);

  useEffect(() => {
    const lineLayers = [
      map?.getLayer?.(LINES_LAYER_ID),
    ].filter(Boolean);
    if (lineLayers.length) {
      lineLayers.forEach((layer) => {
        map.setFilter(layer.id, lineLayerFilter);
      });
    }
  }, [map, lineLayerFilter]);

  useEffect(() => {
    const polygonLayers = [
      map?.getLayer?.(POLYGONS_LAYER_ID),
    ].filter(Boolean);
    if (polygonLayers.length) {
      polygonLayers.forEach((layer) => {
        map.setFilter(layer.id, polygonLayerFilter);
      });
    }
  }, [map, polygonLayerFilter]);

  return null;
};

export default memo(ObservationsLayer);
