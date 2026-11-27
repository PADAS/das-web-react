import { memo, useContext, useMemo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MapContext } from '../MapContext';
import { addMapImage, buildGeoSpanFilter } from '../utils/map';
import {
  API_URL,
  DEFAULT_SYMBOL_LAYOUT,
  DEFAULT_SYMBOL_PAINT,
  LAYER_IDS,
  SYMBOL_TEXT_SIZE_EXPRESSION,
  SYSTEM_CONFIG_FLAGS,
} from '../constants';
import { COLOR_TOKENS, withOpacity } from '../utils/colors';

import MarkerImage from '../common/images/icons/mapbox-blue-marker-icon.png';
import RangerStationsImage from '../common/images/icons/ranger-stations.png';

const SPATIAL_FEATURES_SOURCE = 'spatial-features-source';

const VECTOR_TILE_URL = `${API_URL}spatialfeatures/tiles/{z}/{x}/{y}.pbf`;

export const SYMBOLS_LAYER_ID = 'spatial-features-symbols';
export const SYMBOLS_LABELS_LAYER_ID = 'spatial-features-point-labels';
export const LINES_LAYER_ID = 'spatial-features-lines';
export const LINES_HIT_LAYER_ID = 'spatial-features-lines-hit';
export const LINES_LABELS_LAYER_ID = 'spatial-features-line-labels';
export const POLYGONS_LAYER_ID = 'spatial-features-polygons';
export const POLYGONS_LABELS_LAYER_ID = 'spatial-features-polygon-labels';
export const POLYGONS_OUTLINE_LAYER_ID = 'spatial-features-polygons-outlines';
export const POLYGONS_OUTLINE_HIT_LAYER_ID = 'spatial-features-polygons-outlines-hit';

const HIT_LAYER_IDS = [LINES_HIT_LAYER_ID, POLYGONS_OUTLINE_HIT_LAYER_ID];
const LABELS_LAYER_IDS = [SYMBOLS_LABELS_LAYER_ID, LINES_LABELS_LAYER_ID, POLYGONS_LABELS_LAYER_ID];
const POINTER_LAYER_IDS = [SYMBOLS_LAYER_ID, ...HIT_LAYER_IDS];

const BEFORE_LAYER_ID = 'feature-separation-layer';

const DEFAULT_LINE_PAINT_COLOR = [
  'case',
  ['has', 'stroke'], ['get', 'stroke'],
  ['has', 'color'], ['get', 'color'],
  ['has', 'line_color'], ['get', 'line_color'],
  ['has', 'stroke_color'], ['get', 'stroke_color'],
  COLOR_TOKENS['amber-4']
];

const DEFAULT_POLYGON_FILL_COLOR = [
  'case',
  ['has', 'fill'], ['get', 'fill'],
  ['has', 'fill-color'], ['get', 'fill-color'],
  ['has', 'fill_color'], ['get', 'fill_color'],
  ['has', 'color'], ['get', 'color'],
  ['has', 'stroke'], ['get', 'stroke'],
  'transparent'
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

// Wide enough to click a hairline border without hunting for it.
const HIT_LAYER_PAINT = {
  'line-opacity': 0,
  'line-width': 10,
};

const LABELS_LAYOUT = {
  'text-field': ['get', 'name'],
  'text-font': DEFAULT_SYMBOL_LAYOUT['text-font'],
  'text-size': SYMBOL_TEXT_SIZE_EXPRESSION,
};

const LABELS_PAINT = {
  'text-color': COLOR_TOKENS['ui-text-primary-text'],
  'text-halo-blur': 1,
  'text-halo-color': COLOR_TOKENS['ui-background-primary-background'],
  'text-halo-width': 1,
};

const SpatialFeaturesLayer = ({ onFeatureClick }) => {
  const map = useContext(MapContext);
  const geoSpan = useSelector(state => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.GEO_SPAN]);
  const mapFeatureHighlightIDs = useSelector(state => state.view.mapFeatureHighlightIDs || []);
  const hiddenFeatureIDs = useSelector(state => state.data.mapLayerFilter?.hiddenFeatureIDs ?? []);
  const isShowingFeatureNames = useSelector(
    (state) => !!state.view.showMapNames[LAYER_IDS.SPATIAL_FEATURE_LABELS]?.enabled
  );

  const symbolLayerFilter = useMemo(() => ['all', ['==', ['geometry-type'], 'Point'], ['!', ['in', ['get', 'id'], ['literal', hiddenFeatureIDs]]]], [hiddenFeatureIDs]);
  const lineLayerFilter = useMemo(() => ['all', ['==', ['geometry-type'], 'LineString'], ['!', ['in', ['get', 'id'], ['literal', hiddenFeatureIDs]]]], [hiddenFeatureIDs]);
  const polygonLayerFilter = useMemo(() => ['all', ['==', ['geometry-type'], 'Polygon'], ['!', ['in', ['get', 'id'], ['literal', hiddenFeatureIDs]]]], [hiddenFeatureIDs]);

  const labelsVisibility = isShowingFeatureNames ? 'visible' : 'none';

  const onSymbolClick = useCallback((event) => onFeatureClick(event.features[0], event), [onFeatureClick]);

  // Whatever is drawn above a line takes its click, except the feature names.
  const onLineClick = useCallback((event) => {
    const topmostFeature = map.queryRenderedFeatures(event.point)
      .find((feature) => !LABELS_LAYER_IDS.includes(feature.layer?.id));

    if (HIT_LAYER_IDS.includes(topmostFeature?.layer?.id)) {
      onFeatureClick(event.features[0], event);
    }
  }, [map, onFeatureClick]);

  const onMouseEnter = useCallback(() => {
    map.getCanvas().style.cursor = 'pointer';
  }, [map]);

  const onMouseLeave = useCallback(() => {
    map.getCanvas().style.cursor = '';
  }, [map]);

  // EarthRangerMap authenticates the tiles, so a new token needs no new source.
  useEffect(() => {
    if (!map) return;
    if (!map.getSource(SPATIAL_FEATURES_SOURCE)) {
      const geoSpanFilter = buildGeoSpanFilter(geoSpan);
      map.addSource(SPATIAL_FEATURES_SOURCE, {
        type: 'vector',
        tiles: [VECTOR_TILE_URL],
        minzoom: 0,
        maxzoom: 22,
        ...(geoSpanFilter && { bounds: geoSpanFilter }),
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
      map.addLayer({
        id: POLYGONS_OUTLINE_LAYER_ID,
        type: 'line',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        paint: LINE_LAYERS_PAINT,
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
            withOpacity(COLOR_TOKENS['amber-4'], 25)
          ]
        },
        filter: polygonLayerFilter
      }, POLYGONS_OUTLINE_LAYER_ID);
    }

    if (!map.getLayer(LINES_HIT_LAYER_ID)) {
      map.addLayer({
        id: LINES_HIT_LAYER_ID,
        type: 'line',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        paint: HIT_LAYER_PAINT,
        filter: lineLayerFilter
      }, SYMBOLS_LAYER_ID);
    }

    if (!map.getLayer(POLYGONS_OUTLINE_HIT_LAYER_ID)) {
      map.addLayer({
        id: POLYGONS_OUTLINE_HIT_LAYER_ID,
        type: 'line',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        paint: HIT_LAYER_PAINT,
        filter: polygonLayerFilter
      }, SYMBOLS_LAYER_ID);
    }

    if (!map.getLayer(POLYGONS_LABELS_LAYER_ID)) {
      map.addLayer({
        id: POLYGONS_LABELS_LAYER_ID,
        type: 'symbol',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        layout: { ...LABELS_LAYOUT, visibility: labelsVisibility },
        paint: LABELS_PAINT,
        filter: polygonLayerFilter
      }, BEFORE_LAYER_ID);
    }

    if (!map.getLayer(LINES_LABELS_LAYER_ID)) {
      map.addLayer({
        id: LINES_LABELS_LAYER_ID,
        type: 'symbol',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        layout: { ...LABELS_LAYOUT, 'symbol-placement': 'line', visibility: labelsVisibility },
        paint: LABELS_PAINT,
        filter: lineLayerFilter
      }, BEFORE_LAYER_ID);
    }

    if (!map.getLayer(SYMBOLS_LABELS_LAYER_ID)) {
      map.addLayer({
        id: SYMBOLS_LABELS_LAYER_ID,
        type: 'symbol',
        source: SPATIAL_FEATURES_SOURCE,
        'source-layer': 'spatial_features',
        layout: {
          ...LABELS_LAYOUT,
          'text-anchor': DEFAULT_SYMBOL_LAYOUT['text-anchor'],
          'text-offset': DEFAULT_SYMBOL_LAYOUT['text-offset'],
          visibility: labelsVisibility,
        },
        paint: LABELS_PAINT,
        filter: symbolLayerFilter
      }, BEFORE_LAYER_ID);
    }

    const layerIds = [
      SYMBOLS_LAYER_ID,
      LINES_LAYER_ID,
      POLYGONS_OUTLINE_LAYER_ID,
      POLYGONS_LAYER_ID,
      ...HIT_LAYER_IDS,
      ...LABELS_LAYER_IDS,
    ];

    return () => {
      layerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });

      map.removeSource(SPATIAL_FEATURES_SOURCE);
    };
    // These values only seed the layers; the effects below keep them current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Polygons open a popup from their border only, never from their fill.
  useEffect(() => {
    if (map) {
      map.on('click', SYMBOLS_LAYER_ID, onSymbolClick);
      map.on('click', HIT_LAYER_IDS, onLineClick);
      map.on('mouseenter', POINTER_LAYER_IDS, onMouseEnter);
      map.on('mouseleave', POINTER_LAYER_IDS, onMouseLeave);

      return () => {
        map.off('click', SYMBOLS_LAYER_ID, onSymbolClick);
        map.off('click', HIT_LAYER_IDS, onLineClick);
        map.off('mouseenter', POINTER_LAYER_IDS, onMouseEnter);
        map.off('mouseleave', POINTER_LAYER_IDS, onMouseLeave);
      };
    }
  }, [map, onLineClick, onMouseEnter, onMouseLeave, onSymbolClick]);

  useEffect(() => {
    LABELS_LAYER_IDS.forEach((layerId) => {
      if (map?.getLayer?.(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', labelsVisibility);
      }
    });
  }, [labelsVisibility, map]);

  /* highlight spatial features based on the values in mapFeatureHighlightIDs */
  useEffect(() => {
    const lineLayer = map?.getLayer?.(LINES_LAYER_ID);
    const polyLayer = map?.getLayer?.(POLYGONS_LAYER_ID);

    if (lineLayer) {
      const highlightLinePaintColor = [
        ...DEFAULT_LINE_PAINT_COLOR.slice(0, 1),
        ['in', ['get', 'id'], ['literal', mapFeatureHighlightIDs]], COLOR_TOKENS['red-4'],
        ...DEFAULT_LINE_PAINT_COLOR.slice(1),
      ];

      map.setPaintProperty(lineLayer.id, 'line-color', highlightLinePaintColor);
    }

    if (polyLayer) {
      const highlightPolygonFillColor = [
        ...DEFAULT_POLYGON_FILL_COLOR.slice(0, 1),
        ['in', ['get', 'id'], ['literal', mapFeatureHighlightIDs]], COLOR_TOKENS['red-4'],
        ...DEFAULT_POLYGON_FILL_COLOR.slice(1),
      ];

      map.setPaintProperty(polyLayer.id, 'fill-color', highlightPolygonFillColor);
    }

  }, [map, mapFeatureHighlightIDs]);

  /* filter out point features which are hidden by ID */
  useEffect(() => {
    const symbolLayers = [
      map?.getLayer?.(SYMBOLS_LAYER_ID),
      map?.getLayer?.(SYMBOLS_LABELS_LAYER_ID),
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
      map?.getLayer?.(LINES_HIT_LAYER_ID),
      map?.getLayer?.(LINES_LABELS_LAYER_ID),
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
      map?.getLayer?.(POLYGONS_OUTLINE_HIT_LAYER_ID),
      map?.getLayer?.(POLYGONS_LABELS_LAYER_ID),
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
