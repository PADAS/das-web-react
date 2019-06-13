import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';
import isEqual from 'react-fast-compare';

import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT } from '../constants';
import { getStoredState } from 'redux-persist/es/integration/getStoredStateMigrateV4';
import { toggleMapNameState } from '../ducks/map-ui';

const { SUBJECT_SYMBOLS } = LAYER_IDS;

// TODO - make the text-size 0 for hiding names
const symbolLayout = {
  ...DEFAULT_SYMBOL_LAYOUT,
  'icon-allow-overlap': true,
  'text-allow-overlap': true,
};

//const visibleText = symbolLayout['text-size'];
//const hiddenText = 0;

const getSubjectLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id === 'subject_symbols-symbol')[0];

const SubjectsLayer = memo((props) => {
  const { onSubjectIconClick, subjects, map, showMapNames, ...rest } = props;

  //symbolLayout['text-size'] = showMapNames? visibleText : hiddenText;

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

const mapStateToProps = ( {view:{showMapNames}} ) => {
  return {showMapNames};
}

connect(mapStateToProps, {toggleMapNameState})(SubjectsLayer);