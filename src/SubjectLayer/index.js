import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';

import { withMap } from '../EarthRangerMap';
import withMapNames from '../WithMapNames';

import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

const { SUBJECT_SYMBOLS } = LAYER_IDS;

// TODO - make the text-size 0 for hiding names
const symbolLayout = {
  ...DEFAULT_SYMBOL_LAYOUT,
};

const symbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
};

const getSubjectLayer = (e, map) => map.queryRenderedFeatures(e.point, { layers: [SUBJECT_SYMBOLS] })[0];

const SubjectsLayer = memo((props) => {
  const { onSubjectIconClick, subjects, map, mapNameLayout, ...rest } = props;

  const sourceData = {
    type: 'geojson',
    data: subjects,
  };

  const onSymbolClick = e => onSubjectIconClick(getSubjectLayer(e, map));

  const layout = {
    ...symbolLayout,
    ...mapNameLayout,
  };

  return <Fragment>
    <Source id='subject-symbol-source' geoJsonSource={sourceData} />
    <Layer sourceId='subject-symbol-source' type='symbol'
      id={SUBJECT_SYMBOLS} {...rest} onClick={onSymbolClick}
      paint={symbolPaint} layout={layout} />

  </Fragment>;
});

SubjectsLayer.propTypes = {
  subjects: PropTypes.object.isRequired,
  onSubjectIconClick: PropTypes.func,
};

export default withMapNames(withMap(SubjectsLayer));
