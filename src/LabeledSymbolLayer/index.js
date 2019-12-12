import React, { Fragment, memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

import { withMap } from '../EarthRangerMap';
import withMapNames from '../WithMapNames';

import { Layer } from 'react-mapbox-gl';

const LabeledSymbolLayer = ({ paint, layout, textPaint, textLayout, id, map, mapNameLayout, onInit, onUnmount, onMouseEnter, onMouseLeave, ...rest }) => {
  

  const textLayerId = `${id}-labels`;

  const handleMouseEnter = (e) => {
    map.getCanvas().style.cursor = 'pointer';
    onMouseEnter && onMouseEnter(e);
  };
  const handleMouseLeave = (e) => {
    map.getCanvas().style.cursor = '';
    onMouseLeave && onMouseLeave(e);
  };

  useEffect(() => {
    onInit([id, textLayerId]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const labelLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    ...mapNameLayout,
    ...textLayout,
    'icon-anchor': 'bottom',
    'icon-image': 'name-label-78',
    'icon-size': 1,
    'icon-text-fit': 'both',
    'icon-text-fit-padding': [2,6,2,6],
    'text-offset': [0, 1.1],
  };

  console.log('computed label layout', labelLayout);

  const labelPaint = {
    ...DEFAULT_SYMBOL_PAINT,
    ...textPaint,
    'icon-halo-color': '#FFFFFF',
    // 'icon-halo-width': 8,
    // 'icon-halo-blur': 8,
    'icon-color': '#000000',
    'icon-opacity': 0.85,
  };

  const symbolLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    ...layout,
    'text-field': '',
  };

  console.log('computed symbol layout', symbolLayout);


  const symbolPaint = {
    ...DEFAULT_SYMBOL_PAINT,
    ...paint,
  };

  return <Fragment>
    <Layer id={textLayerId} layout={labelLayout} type='symbol' 
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} 
      paint={labelPaint} {...rest} />
    <Layer id={id} layout={symbolLayout} type='symbol' 
      paint={symbolPaint} onMouseEnter={handleMouseEnter} 
      before={textLayerId} onMouseLeave={handleMouseLeave} {...rest} />
  </Fragment>;
};

export default memo(withMapNames(withMap(LabeledSymbolLayer)));

LabeledSymbolLayer.defaultProps = {
  onInit() {
    return null;
  },
  onUnmount() {
    return null;
  },
};

LabeledSymbolLayer.propTypes = {
  sourceId: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  onInit: PropTypes.func,
  onUnmount: PropTypes.func,
};