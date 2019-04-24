import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';
import isEqual from 'lodash/isEqual';

const getSubjectLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id === 'subject_symbols-symbol')[0];

const SubjectsLayer = memo((props) => {
  const { onSubjectIconClick, subjects, map, ...rest } = props;

  const symbolLayout = {
    'icon-allow-overlap': ["step", ["zoom"], false, 12, true],
    'icon-anchor': 'center',
    'icon-image': ["get", "icon_id"],
    'text-allow-overlap': ["step", ["zoom"], false, 12, true],
    'text-anchor': 'top',
    'text-offset': [0, .5],
    'text-field': '{name}',
    'text-justify': 'center',
    'text-size': 12,
  };

  const onSymbolClick = e => onSubjectIconClick(getSubjectLayer(e, map));

  return (
    <GeoJSONLayer
      id="subject_symbols"
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