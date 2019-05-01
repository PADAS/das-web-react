import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';

const symbolLayout = {
  'icon-allow-overlap': ["step", ["zoom"], false, 12, true],
  'icon-anchor': 'center',
  'icon-image': ["get", "icon_id"],
  'text-allow-overlap': ["step", ["zoom"], false, 12, true],
  'text-anchor': 'top',
  'text-offset': [0, .5],
  'text-field': '{title}',
  'text-justify': 'center',
  'text-size': 12,
};

const linePaint = {
  'line-color': [
    'case',
    ['has', 'stroke'], ['get', 'stroke'],
    'orange',
  ],
  'line-opacity': [
    'case',
    ['has', 'stroke-opacity'], ['get', 'stroke-opacity'],
    1,
  ],
  'line-width': [
    'case',
    ['has', 'stroke-width'], ['get', 'stroke-width'],
    1,
  ],
};

const fillLayout = {
  'visibility': 'visible',
};

const fillPaint = {
  'fill-color': [
    'case',
    ['has', 'fill'], ['get', 'fill'],
    'blue',
  ],
  'fill-opacity': [
    'case',
    ['has', 'fill-opacity'], ['get', 'fill-opacity'],
    0,
  ],
};

const lineLayout = {
  'line-join': 'round',
  'line-cap': 'round',
};

const FeatureLayer = memo(({ symbols, lines, polygons }) => {
  console.log('re rendering the feature layer', symbols, lines, polygons);
  return <Fragment>
    <GeoJSONLayer before="subject_symbols-symbol" data={polygons}
      fillPaint={fillPaint}
      fillLayout={fillLayout}
    />
    <GeoJSONLayer before="subject_symbols-symbol" data={lines}
      lineLayout={lineLayout}
      linePaint={linePaint}
    />
    <GeoJSONLayer before="subject_symbols-symbol" data={symbols}
      symbolLayout={symbolLayout}
    />
  </Fragment>
});

FeatureLayer.propTypes = {
  symbols: PropTypes.object.isRequired,
  lines: PropTypes.object.isRequired,
  polygons: PropTypes.object.isRequired,
};

export default FeatureLayer;