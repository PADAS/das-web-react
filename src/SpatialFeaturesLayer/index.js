import React, { memo, useContext, useMemo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MapContext } from '../App';
import { addMapImage, safeRemoveMapLayer, safeRemoveMapSource, buildGeoSpanFilter } from '../utils/map';
import { API_URL, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT, SYSTEM_CONFIG_FLAGS } from '../constants';
import { selectTrackLengthInDays } from '../selectors/tracks';

import MarkerImage from '../common/images/icons/mapbox-blue-marker-icon.png';
import RangerStationsImage from '../common/images/icons/ranger-stations.png';

const SPATIAL_FEATURES_SOURCE = 'spatial-features-source';

const VECTOR_TILE_BASE = `${API_URL}spatialfeatures/tiles/{z}/{x}/{y}.pbf`;
const buildVectorTileUrl = (rangeParam) => `${VECTOR_TILE_BASE}?range=${rangeParam}`;

export const SYMBOLS_LAYER_ID = 'spatial-features-symbols';
// const SYMBOLS_LABELS_LAYER_ID = 'spatial-features-point-labels';
export const LINES_LAYER_ID = 'spatial-features-lines';
// const LINES_LABELS_LAYER_ID = 'spatial-features-line-labels';
export const POLYGONS_LAYER_ID = 'spatial-features-polygons';
// const POLYGONS_LABELS_LAYER_ID = 'spatial-features-polygon-labels';
export const POLYGONS_OUTLINE_LAYER_ID = 'spatial-features-polygons-outlines';

const BEFORE_LAYER_ID = 'feature-separation-layer';

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
  ['has', 'fill-color'], ['get', 'fill-color'],
  ['has', 'fill_color'], ['get', 'fill_color'],
  ['has', 'color'], ['get', 'color'],
  ['has', 'stroke'], ['get', 'stroke'],
  'rgba(255, 102, 0, 0)'
];

const LINE_LAYERS_PAINT = {
  'line-color': DEFAULT_LINE_PAINT_COLOR,
  'line-width': [
    'case',
    ['has', 'stroke-width'], ['get', 'stroke-width'],
    ['has', 'width'], ['get', 'width'],
    ['has', 'line_width'], ['get', 'line_width'],
    ['has', 'stroke_width'], ['get', 'stroke_width'],
    1,
  ],
  'line-opacity': [
    'case',
    ['has', 'stroke-opacity'], ['get', 'stroke-opacity'],
    ['has', 'opacity'], ['get', 'opacity'],
    ['has', 'line_opacity'], ['get', 'line_opacity'],
    ['has', 'stroke_opacity'], ['get', 'stroke_opacity'],
    1
  ]
};



const SpatialFeaturesLayer = ({ onFeatureClick }) => {
  const map = useContext(MapContext);
  const token = useSelector(state => state.data.token);
  const trackLengthInDays = useSelector(selectTrackLengthInDays);
  const rangeParam = trackLengthInDays <= 45 ? '45' : 'all';
  const geoSpan = useSelector(state => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.GEO_SPAN]);
  const mapFeatureHighlightIDs = useSelector(state => state.view.mapFeatureHighlightIDs || []);
  const hiddenFeatureIDs = useSelector(state => state.data.mapLayerFilter?.hiddenFeatureIDs ?? []);

  const symbolLayerFilter = useMemo(() => ['all', ['==', ['geometry-type'], 'Point'], ['!', ['in', ['get', 'id'], ['literal', hiddenFeatureIDs]]]], [hiddenFeatureIDs]);
  const lineLayerFilter = useMemo(() => ['all', ['==', ['geometry-type'], 'LineString'], ['!', ['in', ['get', 'id'], ['literal', hiddenFeatureIDs]]]], [hiddenFeatureIDs]);
  const polygonLayerFilter = useMemo(() => ['all', ['==', ['geometry-type'], 'Polygon'], ['!', ['in', ['get', 'id'], ['literal', hiddenFeatureIDs]]]], [hiddenFeatureIDs]);

  const handleFeatureClick = useCallback((event) => {
    const features = map.queryRenderedFeatures(event.point, {
      layers: [SYMBOLS_LAYER_ID, LINES_LAYER_ID, POLYGONS_OUTLINE_LAYER_ID, POLYGONS_LAYER_ID]
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

  /* add the vector source + append bearer token to request headers */
  /* add the vector layer and bind the event handlers */
  useEffect(() => {
    if (!map) return;
    if (!map.getSource(SPATIAL_FEATURES_SOURCE)) {
      const geoSpanFilter = buildGeoSpanFilter(geoSpan);
      map.addSource(SPATIAL_FEATURES_SOURCE, {
        type: 'vector',
        tiles: [buildVectorTileUrl(rangeParam)],
        minzoom: 0,
        maxzoom: 22,
        ...(geoSpanFilter && { bounds: geoSpanFilter }),
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

    /* add the layer */
    if (!map.getLayer(SYMBOLS_LAYER_ID)) {
      map.addLayer({
        id: SYMBOLS_LAYER_ID,
        type: 'symbol',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        layout: {
          ...DEFAULT_SYMBOL_LAYOUT,
          'text-allow-overlap': true,
          'icon-allow-overlap': true,
          'text-ignore-placement': true,
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
      }, BEFORE_LAYER_ID);
    }

    if (!map.getLayer(LINES_LAYER_ID)) {
      map.addLayer({
        id: LINES_LAYER_ID,
        type: 'line',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        paint: LINE_LAYERS_PAINT,
        filter: lineLayerFilter
      }, SYMBOLS_LAYER_ID);
    }

    if (!map.getLayer(POLYGONS_OUTLINE_LAYER_ID)) {
      const paint = {
        ...LINE_LAYERS_PAINT,
      };

      paint['stroke'] = [
        'case',
        ['has', 'stroke'], ['get', 'stroke'],
        ['has', 'outline_color'], ['get', 'outline_color'],
        ['has', 'border_color'], ['get', 'border_color'],
        'rgba(255, 102, 0, 0.25)'
      ];

      map.addLayer({
        id: POLYGONS_OUTLINE_LAYER_ID,
        type: 'line',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        paint,
        filter: polygonLayerFilter // this feed polygons into a line-typed layer so users can add stroke-width and stroke-opacity to their polygon features
      }, LINES_LAYER_ID);
    }

    if (!map.getLayer(POLYGONS_LAYER_ID)) {
      map.addLayer({
        id: POLYGONS_LAYER_ID,
        type: 'fill',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
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
            'rgba(255, 102, 0, 0.25)'
          ]
        },
        filter: polygonLayerFilter
      }, POLYGONS_OUTLINE_LAYER_ID);
    }

    /* // Add separate label layers for each geometry type
    if (!map.getLayer(LINES_LABELS_LAYER_ID)) {
      map.addLayer({
        id: LINES_LABELS_LAYER_ID,
        type: 'symbol',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        layout: {
          'text-field': ['coalesce', ['get', 'title'], ['get', 'name'], ''],
          'text-size': 14,
          'symbol-placement': 'line', // Along the line
          'text-anchor': 'center',
          'text-max-angle': 45,
          'text-letter-spacing': 0.05,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          ...DEFAULT_SYMBOL_PAINT,
          'text-halo-color': '#ffffff',
          'text-halo-width': 1,
          'text-halo-blur': 1,
        },
        filter: lineLayerFilter
      });
    }

    if (!map.getLayer(SYMBOLS_LABELS_LAYER_ID)) {
      map.addLayer({
        id: SYMBOLS_LABELS_LAYER_ID,
        type: 'symbol',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        layout: {
          'text-field': ['coalesce', ['get', 'title'], ['get', 'name'], ''],
          'text-size': 14,
          'symbol-placement': 'point',
          'text-anchor': 'bottom',
          'text-offset': [0, 1.5], // Below the point symbol
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          ...DEFAULT_SYMBOL_PAINT,
          'text-halo-color': '#ffffff',
          'text-halo-width': 1,
          'text-halo-blur': 1,
        },
        filter: ['all',
          ['==', ['geometry-type'], 'Point'],
          ['!', ['in', ['get', 'id'], ['literal', hiddenFeatureIDs]]]
        ]
      });
    }

    // Add labels for polygon features
    if (!map.getLayer(POLYGONS_LABELS_LAYER_ID)) {
      map.addLayer({
        id: POLYGONS_LABELS_LAYER_ID,
        type: 'symbol',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        layout: {
          'text-field': ['coalesce', ['get', 'title'], ['get', 'name'], ''],
          'text-size': 14,
          'symbol-placement': 'point', // Center of polygon
          'text-anchor': 'center',
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          ...DEFAULT_SYMBOL_PAINT,
          'text-halo-color': '#ffffff',
          'text-halo-width': 1,
          'text-halo-blur': 1,
        },
        filter: ['all',
          ['==', ['geometry-type'], 'Polygon'],
          ['!', ['in', ['get', 'id'], ['literal', hiddenFeatureIDs]]]
        ]
      });
    } */

    const layerIds = [
      SYMBOLS_LAYER_ID,
      LINES_LAYER_ID,
      POLYGONS_OUTLINE_LAYER_ID,
      POLYGONS_LAYER_ID,
      /* LINES_LABELS_LAYER_ID,
        SYMBOLS_LABELS_LAYER_ID,
        POLYGONS_LABELS_LAYER_ID */
    ];

    layerIds.forEach(layerId => {
      map.on('click', layerId, handleFeatureClick);
    });

    map.on('mouseenter', SYMBOLS_LAYER_ID, onMouseEnter);
    map.on('mouseleave', SYMBOLS_LAYER_ID, onMouseLeave);

    return () => {
      if (!map) return;
      layerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.off('click', layerId, handleFeatureClick);
          safeRemoveMapLayer(map, layerId);
        }
      });
      map.off('mouseenter', SYMBOLS_LAYER_ID, onMouseEnter);
      map.off('mouseleave', SYMBOLS_LAYER_ID, onMouseLeave);
      safeRemoveMapSource(map, SPATIAL_FEATURES_SOURCE);
    };
    /*
      # disable exhaustive dependencies here, since
      # the filters are just used as an initializing state, not as a lifecycle dependency. 
      # this will help us support possible in-memory retention/rehydration in the future (via saved app state).
    */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, rangeParam, handleFeatureClick, onMouseEnter, onMouseLeave, token?.access_token]);

  /* highlight spatial features based on the values in mapFeatureHighlightIDs */
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

  /* filter out point features which are hidden by ID */
  useEffect(() => {
    const symbolLayers = [
      map?.getLayer?.(SYMBOLS_LAYER_ID),
      // map?.getLayer?.(SYMBOLS_LABELS_LAYER_ID),
    ].filter(Boolean);

    if (symbolLayers.length) {
      symbolLayers.forEach((layer) => {
        map.setFilter(layer.id, symbolLayerFilter);
      });
    }
  }, [map, symbolLayerFilter]);

  /* filter out line features which are hidden by ID */
  useEffect(() => {
    const lineLayers = [
      map?.getLayer?.(LINES_LAYER_ID),
      // map?.getLayer?.(LINES_LABELS_LAYER_ID)
    ].filter(Boolean);

    if (lineLayers.length) {
      lineLayers.forEach((layer) => {
        map.setFilter(layer.id, lineLayerFilter);
      });
    }
  }, [map, lineLayerFilter]);

  /* filter out polygon features which are hidden by ID */
  useEffect(() => {
    const polygonLayers = [
      map?.getLayer?.(POLYGONS_LAYER_ID),
      map?.getLayer?.(POLYGONS_OUTLINE_LAYER_ID),
      // map?.getLayer?.(POLYGONS_LABELS_LAYER_ID),
    ].filter(Boolean);

    if (polygonLayers.length) {
      polygonLayers.forEach((layer) => {
        map.setFilter(layer.id, polygonLayerFilter);
      });
    }
  }, [map, polygonLayerFilter]);

  useEffect(() => {
    if (!map?.hasImage?.('marker-icon')) {
      addMapImage({ src: MarkerImage, id: 'marker-icon' });
    }
    if (!map?.hasImage?.('ranger-stations')) {
      addMapImage({ src: RangerStationsImage, id: 'ranger-stations' });
    }
  }, [map]);

  return null;
};

export default memo(SpatialFeaturesLayer);
