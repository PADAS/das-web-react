import { memo, useCallback, useContext, useEffect } from 'react';

import withMapViewConfig from '../WithMapViewConfig';

import { getFeatureSymbolGeoJsonAtPoint } from '../utils/features';
import { addFeatureCollectionImagesToMap, addMapImage } from '../utils/map';
import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT, SOURCE_IDS } from '../constants';

import MarkerImage from '../common/images/icons/mapbox-blue-marker-icon.png';
import RangerStationsImage from '../common/images/icons/ranger-stations.png';
import { useMapEventBinding } from '../hooks';
import useMapSources from '../hooks/useMapSources';
import { MapContext } from '../App';
import useMapLayers from '../hooks/useMapLayers';

const { FEATURE_FILLS, FEATURE_LINES, FEATURE_SYMBOLS, SKY_LAYER } = LAYER_IDS;

const { MAP_FEATURES_LINES_SOURCE, MAP_FEATURES_POLYGONS_SOURCE, MAP_FEATURES_SYMBOLS_SOURCE } = SOURCE_IDS;

const ACTIVE_FEATURE_STATE = 'active';
const IF_ACTIVE = (activeProp) => [['boolean', ['feature-state', ACTIVE_FEATURE_STATE], false], activeProp];

const IF_HAS_PROPERTY = (prop, defaultValue) => {
  return [['has', prop], ['get', prop], defaultValue];
};

const linePaint = {
  'line-color': [
    'case',
    ...IF_ACTIVE('blue'),
    ...IF_HAS_PROPERTY('stroke', 'orange'),
  ],
  'line-opacity': [
    'case',
    ...IF_HAS_PROPERTY('stroke-opacity', 1),
  ],
  'line-width': [
    'case',
    ...IF_ACTIVE(3),
    ...IF_HAS_PROPERTY('stroke-width', 1),
  ],
};

const fillLayout = {
  'visibility': 'visible',
};

const fillPaint = {
  'fill-color': [
    'case',
    ...IF_ACTIVE('blue'),
    ...IF_HAS_PROPERTY('fill', 'orange'),
  ],
  'fill-opacity': [
    'case',
    ...IF_HAS_PROPERTY('fill-opacity', 0),
  ],
};

const lineLayout = {
  'line-join': 'round',
  'line-cap': 'round',
};


const symbolLayout = {
  ...DEFAULT_SYMBOL_LAYOUT,
  'icon-image': ['case',
    ['==', ['get', 'title'], 'Ranger Stations'], 'ranger-stations',
    ['has', 'image'], DEFAULT_SYMBOL_LAYOUT['icon-image'],
    'marker-icon',
  ],
  'text-size': 0,
  'icon-anchor': 'center',
};

const symbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
};

const FeatureLayer = ({ symbols, lines, polygons, onFeatureSymbolClick, mapUserLayoutConfig, minZoom }) => {
  const map = useContext(MapContext);

  const layout = {
    ...symbolLayout,
    ...mapUserLayoutConfig,
  };

  useEffect(() => {
    addFeatureCollectionImagesToMap(symbols);
  }, [symbols]);

  useEffect(() => {
    if (!!map && !map.hasImage('marker-icon')) {
      addMapImage({ src: MarkerImage, id: 'marker-icon' });
    }
    if (!!map && !map.hasImage('ranger-stations')) {
      addMapImage({ src: RangerStationsImage, id: 'ranger-stations' });
    }
  }, [map]);


  const onSymbolMouseEnter = useCallback(() => map.getCanvas().style.cursor = 'pointer', [map]);
  const onSymbolMouseLeave = useCallback(() => map.getCanvas().style.cursor = '', [map]);
  const removeFeatureHighlightOnMapClick = useCallback(() => {
    map
      .queryRenderedFeatures({ layers: [FEATURE_FILLS, FEATURE_LINES] })
      .forEach(f => map.setFeatureState(f, { 'active': false })
      );
  }, [map]);

  // find the symbol in the feature layer before propogating to callback
  const onSymbolClick = (e) => {
    const geojson = getFeatureSymbolGeoJsonAtPoint(e.point, map);
    onFeatureSymbolClick(geojson);
  };

  const layerConfig = { minZoom, before: SKY_LAYER };

  useMapSources([{ id: MAP_FEATURES_LINES_SOURCE, data: lines }]);
  useMapSources([{ id: MAP_FEATURES_POLYGONS_SOURCE, data: polygons }]);
  useMapSources([{ id: MAP_FEATURES_SYMBOLS_SOURCE, data: symbols }]);

  // (layerId, type, sourceId, paint, layout, filter, min-zoom, max-zoom, condition = true)
  useMapLayers([{
    id: FEATURE_FILLS,
    type: 'fill',
    sourceId: MAP_FEATURES_POLYGONS_SOURCE,
    paint: fillPaint,
    layout: fillLayout,
    options: layerConfig
  }]);

  useMapLayers([{
    id: FEATURE_LINES,
    type: 'line',
    sourceId: MAP_FEATURES_LINES_SOURCE,
    paint: linePaint,
    layout: lineLayout,
    options: layerConfig
  }]);

  useMapLayers([{
    id: FEATURE_SYMBOLS,
    type: 'symbol',
    sourceId: MAP_FEATURES_SYMBOLS_SOURCE,
    paint: symbolPaint,
    layout: layout,
    options: layerConfig
  }]);

  useMapEventBinding('click', onSymbolClick, FEATURE_SYMBOLS);
  useMapEventBinding('mouseenter', onSymbolMouseEnter, FEATURE_SYMBOLS);
  useMapEventBinding('mouseleave', onSymbolMouseLeave, FEATURE_SYMBOLS);
  useMapEventBinding('mousedown', removeFeatureHighlightOnMapClick);

  return null;
};

export default memo(withMapViewConfig(FeatureLayer));
