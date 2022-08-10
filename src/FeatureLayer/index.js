import React, { memo, useEffect } from 'react';
import PropTypes from 'prop-types';

import { withMap } from '../EarthRangerMap';
import withMapViewConfig from '../WithMapViewConfig';

import { getFeatureSymbolGeoJsonAtPoint } from '../utils/features';
import { addFeatureCollectionImagesToMap, addMapImage } from '../utils/map';
import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

import MarkerImage from '../common/images/icons/mapbox-blue-marker-icon.png';
import RangerStationsImage from '../common/images/icons/ranger-stations.png';
import { useMapEventBinding, useMapLayer, useMapSource } from '../hooks';

const { FEATURE_FILLS, FEATURE_LINES, FEATURE_SYMBOLS, TOPMOST_STYLE_LAYER } = LAYER_IDS;

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

  const layerConfig = { minZoom };

  useMapSource('feature-line-source', lines);
  useMapSource('feature-polygon-source', polygons);
  useMapSource('feature-symbol-source', symbols);

  // (layerId, type, sourceId, paint, layout, filter, minzoom, maxzoom, condition = true)
  useMapLayer(FEATURE_FILLS, 'fill', 'feature-polygon-source', fillPaint, fillLayout, layerConfig);
  useMapLayer(FEATURE_LINES, 'line', 'feature-line-source', linePaint, lineLayout, layerConfig);
  useMapLayer(FEATURE_SYMBOLS, 'symbol', 'feature-symbol-source', symbolPaint, layout, layerConfig);

  useMapEventBinding('click', onSymbolClick, FEATURE_SYMBOLS);
  useMapEventBinding('mouseenter', onSymbolMouseEnter, FEATURE_SYMBOLS);
  useMapEventBinding('mouseleave', onSymbolMouseLeave, FEATURE_SYMBOLS);

  return null;
/*   
  <Fragment>

    <Layer minZoom={minZoom} sourceId='feature-polygon-source' type='fill'
      id={FEATURE_FILLS} before={TOPMOST_STYLE_LAYER}
      paint={fillPaint} layout={fillLayout} />

    <Layer minZoom={minZoom} sourceId='feature-line-source' type='line'
      id={FEATURE_LINES} before={TOPMOST_STYLE_LAYER}
      paint={linePaint} layout={lineLayout} />

    <Layer minZoom={minZoom} sourceId='feature-symbol-source' type='symbol'
      id={FEATURE_SYMBOLS}
      before={TOPMOST_STYLE_LAYER}
      paint={symbolPaint} layout={layout}
      onMouseEnter={onSymbolMouseEnter}
      onMouseLeave={onSymbolMouseLeave}
      onClick={onSymbolClick} />
  </Fragment>; */
};

FeatureLayer.propTypes = {
  symbols: PropTypes.object.isRequired,
  lines: PropTypes.object.isRequired,
  polygons: PropTypes.object.isRequired,
};

export default memo(withMap(withMapViewConfig(FeatureLayer)));