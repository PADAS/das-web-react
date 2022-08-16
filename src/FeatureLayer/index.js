import React, { memo, useEffect } from 'react';
import PropTypes from 'prop-types';

import { withMap } from '../EarthRangerMap';
import withMapViewConfig from '../WithMapViewConfig';

import { getFeatureSymbolGeoJsonAtPoint } from '../utils/features';
import { addFeatureCollectionImagesToMap, addMapImage } from '../utils/map';
import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT, SOURCE_IDS } from '../constants';

import MarkerImage from '../common/images/icons/mapbox-blue-marker-icon.png';
import RangerStationsImage from '../common/images/icons/ranger-stations.png';
import { useMapEventBinding, useMapLayer, useMapSource } from '../hooks';

const { FEATURE_FILLS, FEATURE_LINES, FEATURE_SYMBOLS, TOPMOST_STYLE_LAYER } = LAYER_IDS;

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

const FeatureLayer = ({ symbols, lines, polygons, onFeatureSymbolClick, mapUserLayoutConfig, minZoom, map }) => {
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


  const onSymbolMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onSymbolMouseLeave = () => map.getCanvas().style.cursor = '';

  // find the symbol in the feature layer before propogating to callback
  const onSymbolClick = (e) => {
    const geojson = getFeatureSymbolGeoJsonAtPoint(e.point, map);
    onFeatureSymbolClick(geojson);
  };

  const layerConfig = { minZoom, before: TOPMOST_STYLE_LAYER };

  useMapSource(MAP_FEATURES_LINES_SOURCE, lines);
  useMapSource(MAP_FEATURES_POLYGONS_SOURCE, polygons);
  useMapSource(MAP_FEATURES_SYMBOLS_SOURCE, symbols);

  // (layerId, type, sourceId, paint, layout, filter, minzoom, maxzoom, condition = true)
  useMapLayer(FEATURE_FILLS, 'fill', MAP_FEATURES_POLYGONS_SOURCE, fillPaint, fillLayout, layerConfig);
  useMapLayer(FEATURE_LINES, 'line', MAP_FEATURES_LINES_SOURCE, linePaint, lineLayout, layerConfig);
  useMapLayer(FEATURE_SYMBOLS, 'symbol', MAP_FEATURES_SYMBOLS_SOURCE, symbolPaint, layout, layerConfig);

  useMapEventBinding('click', onSymbolClick, FEATURE_SYMBOLS);
  useMapEventBinding('mouseenter', onSymbolMouseEnter, FEATURE_SYMBOLS);
  useMapEventBinding('mouseleave', onSymbolMouseLeave, FEATURE_SYMBOLS);

  return null;
};

FeatureLayer.propTypes = {
  symbols: PropTypes.object.isRequired,
  lines: PropTypes.object.isRequired,
  polygons: PropTypes.object.isRequired,
};

export default memo(withMap(withMapViewConfig(FeatureLayer)));