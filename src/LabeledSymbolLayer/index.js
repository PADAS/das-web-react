import React, { Fragment, memo, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

import { withMap } from '../EarthRangerMap';
import withMapNames from '../WithMapNames';

import { Layer } from 'react-mapbox-gl';

const LabeledSymbolLayer = ({ paint, layout, textPaint, textLayout, id, map, mapNameLayout, onClick, onInit, onUnmount, onMouseEnter, onMouseLeave, ...rest }) => {
  
  const textLayerId = `${id}-labels`;


  const handleMouseEnter = (e) => {
    map.getCanvas().style.cursor = 'pointer';
    onMouseEnter && onMouseEnter(e);
  };
  const handleMouseLeave = (e) => {
    map.getCanvas().style.cursor = '';
    onMouseLeave && onMouseLeave(e);
  };

  const handleClick = useCallback((e) => {
    onClick && onClick(e);
  }, [onClick]);

  const unbindClick = useCallback(() => {
    map.off('click', id, handleClick);
    map.off('click', textLayerId, handleClick);
  }, [handleClick, id, map, textLayerId]);

  const bindClick = useCallback(() => {
    map.on('click', id, handleClick);
    map.on('click', textLayerId, handleClick);
  }, [handleClick, id, map, textLayerId]);

  useEffect(() => {
    onInit([id, textLayerId]);
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */


  useEffect(() => {
    unbindClick();
    bindClick();
    return unbindClick;
  }, [bindClick, handleClick, id, map, onClick, textLayerId, unbindClick]);


  const labelLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    ...textLayout,
    'icon-anchor': 'bottom',
    'icon-image': 'name-label-78',
    'icon-size': 1,
    'icon-text-fit': 'both',
    'icon-text-fit-padding': [2,6,2,6],
    'text-anchor': 'top',
    ...mapNameLayout,
    // 'text-offset': [0, 1.1],
  };

  const labelPaint = {
    ...DEFAULT_SYMBOL_PAINT,
    'icon-opacity': 0.5,
    ...textPaint,
  };

  const symbolLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    ...layout,
    'text-field': '',
  };

  const symbolPaint = {
    ...DEFAULT_SYMBOL_PAINT,
    ...paint,
  };

  return id && <Fragment>
    <Layer id={textLayerId} before={id} layout={labelLayout} type='symbol' 
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} 
      paint={labelPaint} {...rest} />
    <Layer id={id} layout={symbolLayout} type='symbol' 
      paint={symbolPaint} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...rest} />
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