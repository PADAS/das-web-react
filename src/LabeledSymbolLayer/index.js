import React, { memo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

import { withMap } from '../EarthRangerMap';
import withMapViewConfig from '../WithMapViewConfig';

import { useMapEventBinding, useMapLayer } from '../hooks';

const LabeledSymbolLayer = (
  { before, paint, layout, textPaint, textLayout, id, sourceId, map, mapUserLayoutConfigByLayerId, onClick, onInit,
    onMouseEnter, onMouseLeave, filter }
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
    onClick?.(e);
  }, [onClick]);


  useEffect(() => {
    onInit([id, textLayerId]);
  }, [id, onInit, textLayerId]);


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

  const layerConfig = { before, filter };

  useMapEventBinding('click', handleClick, id);
  useMapEventBinding('click', handleClick, textLayerId);

  useMapEventBinding('mouseenter', handleMouseEnter, id);
  useMapEventBinding('mouseenter', handleMouseEnter, textLayerId);

  useMapEventBinding('mouseleave', handleMouseLeave, id);
  useMapEventBinding('mouseleave', handleMouseLeave, textLayerId);

  useMapLayer(id, 'symbol', sourceId, symbolPaint, symbolLayout, layerConfig);
  useMapLayer(textLayerId, 'symbol', sourceId, labelPaint, labelLayout, layerConfig);

  return null;
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