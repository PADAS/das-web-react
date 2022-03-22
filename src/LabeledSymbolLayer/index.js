import React, { Fragment, memo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

import { withMap } from '../EarthRangerMap';
import withMapViewConfig from '../WithMapViewConfig';

import { Layer } from 'react-mapbox-gl';

const LabeledSymbolLayer = (
  { before, paint, layout, textPaint, textLayout, id, map, mapUserLayoutConfigByLayerId, minZoom, onClick, onInit,
    onMouseEnter, onMouseLeave, ...rest }
) => {
  const textLayerId = `${id}-labels`;

  const handleMouseEnter = (e) => {
    map.getCanvas().style.cursor = 'pointer';

    onMouseEnter && onMouseEnter(e);
  };
  const handleMouseLeave = (e) => {
    const qualifiedLayers = map.queryRenderedFeatures(e.point, { layers: [id, textLayerId] });

    if (!qualifiedLayers.length) {
      map.getCanvas().style.cursor = '';
      onMouseLeave && onMouseLeave(e);
    }
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
    'icon-image': 'name-label-78-sdf',
    'icon-size': 1,
    'icon-text-fit': 'both',
    'icon-text-fit-padding': [5, 8, 5, 8],
    'text-anchor': 'top',
    'text-offset': [0, 1.1],
    ...mapUserLayoutConfigByLayerId(id),
  };

  const labelPaint = {
    ...DEFAULT_SYMBOL_PAINT,
    'icon-opacity': 0.5,
    'icon-color': '#ffffff',
    ...textPaint,
  };

  const symbolLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    'text-field': '',
    ...layout,
  };

  const symbolPaint = {
    ...DEFAULT_SYMBOL_PAINT,
    ...paint,
  };

  return id && <Fragment>
    <Layer id={id} before={before} layout={symbolLayout} minZoom={minZoom} type='symbol'
      paint={symbolPaint} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...rest} />
    <Layer before={id} id={textLayerId} layout={labelLayout} minZoom={minZoom} type='symbol'
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      paint={labelPaint} {...rest} />
  </Fragment>;
};

export default memo(withMapViewConfig(withMap(LabeledSymbolLayer)));

LabeledSymbolLayer.defaultProps = {
  onInit() {
    return null;
  },
};

LabeledSymbolLayer.propTypes = {
  sourceId: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  onInit: PropTypes.func,
};