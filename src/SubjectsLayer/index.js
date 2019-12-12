import React, { memo, Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Source } from 'react-mapbox-gl';

import { addFeatureCollectionImagesToMap } from '../utils/map';

import { withMap } from '../EarthRangerMap';
import withMapNames from '../WithMapNames';

import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT } from '../constants';
import LabeledSymbolLayer from '../LabeledSymbolLayer';

const { SUBJECT_SYMBOLS } = LAYER_IDS;

const SubjectsLayer = (props) => {
  const { allowOverlap, onSubjectIconClick, subjects, map, mapNameLayout, ...rest } = props;
  
  const [layerIds, setLayerIds] = useState([]);

  const getSubjectLayer = (e, map) => map.queryRenderedFeatures(e.point, { layers: layerIds })[0];

  const sourceData = {
    type: 'geojson',
    data: subjects,
  };

  const layoutConfig = allowOverlap ? {
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
  } : {};

  useEffect(() => {
    subjects && addFeatureCollectionImagesToMap(subjects, map);
  }, [map, subjects]);

  const onSymbolClick = (e) => onSubjectIconClick(getSubjectLayer(e, map));

  const layout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    ...layoutConfig,
    ...mapNameLayout,
  };

  return <Fragment>
    <Source id='subject-symbol-source' geoJsonSource={sourceData} />
    <LabeledSymbolLayer sourceId='subject-symbol-source' onInit={setLayerIds}
      id={SUBJECT_SYMBOLS} onClick={onSymbolClick} iconLayout={layout} {...rest} />
    {/* <Layer sourceId='subject-symbol-source' type='symbol'
      id={SUBJECT_SYMBOLS} {...rest} onClick={onSymbolClick}
      paint={symbolPaint} layout={layout} /> */}

  </Fragment>;
};

SubjectsLayer.propTypes = {
  subjects: PropTypes.object.isRequired,
  onSubjectIconClick: PropTypes.func,
};

export default withMapNames(withMap(memo(SubjectsLayer)));
