import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';
import isEqual from 'react-fast-compare';

import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT } from '../constants';

const { SUBJECT_SYMBOLS } = LAYER_IDS;

const symbolLayout = {
  ...DEFAULT_SYMBOL_LAYOUT,
};

const getSubjectLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id === 'subject_symbols-symbol')[0];

const SubjectsLayer = memo((props) => {
  const { onSubjectIconClick, subjects, map, ...rest } = props;

  const onSymbolClick = e => onSubjectIconClick(getSubjectLayer(e, map));

  return (
    <GeoJSONLayer
      id={SUBJECT_SYMBOLS}
      {...rest}
      symbolOnClick={onSymbolClick}
      data={subjects}
      symbolLayout={symbolLayout} />
  );
}, (prev, current) => (prev.map && current.map) && isEqual(prev.subjects, current.subjects));

export default SubjectsLayer;

SubjectsLayer.propTypes = {
  subjects: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  onSubjectIconClick: PropTypes.func,
};