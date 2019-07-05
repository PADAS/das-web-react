import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';
import isEqual from 'react-fast-compare';

import { withMap } from '../EarthRangerMap';

import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';
import { toggleMapNameState } from '../ducks/map-ui';

const { SUBJECT_SYMBOLS } = LAYER_IDS;

// TODO - make the text-size 0 for hiding names
const symbolLayout = {
  ...DEFAULT_SYMBOL_LAYOUT,
};

const symbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
};

const getSubjectLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id === 'subject_symbols-symbol')[0];

const SubjectsLayer = memo((props) => {
  const { onSubjectIconClick, subjects, map, showMapNames, ...rest } = props;

  const onSymbolClick = e => onSubjectIconClick(getSubjectLayer(e, map));

  const layout = {
    ...symbolLayout,
    'text-size': showMapNames ? symbolLayout['text-size'] : 0,
  };

  return (
    <GeoJSONLayer
      id={SUBJECT_SYMBOLS}
      {...rest}
      symbolOnClick={onSymbolClick}
      data={subjects}
      symbolPaint={symbolPaint}
      symbolLayout={layout} />
  );
}, (prev, current) => (prev.map && current.map) 
            && isEqual(prev.subjects, current.subjects)
            && isEqual(prev.showMapNames, current.showMapNames));

SubjectsLayer.propTypes = {
  subjects: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  onSubjectIconClick: PropTypes.func,
};

const mapStateToProps = ( {view:{showMapNames}} ) => {
  return {showMapNames};
};

export default connect(mapStateToProps, {toggleMapNameState})(withMap(SubjectsLayer));
