import React, { memo, Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Source } from '../PatrolStartStopLayer/node_modules/react-mapbox-gl';
import { featureCollection } from '@turf/helpers';

import { calcImgIdFromUrlForMapImages } from '../utils/img';

import { addFeatureCollectionImagesToMap } from '../utils/map';

import { withMap } from '../EarthRangerMap';
import withMapViewConfig from '../WithMapViewConfig';
import LabeledSymbolLayer from '../LabeledSymbolLayer';

import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';
import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';

const { SUBJECT_SYMBOLS } = LAYER_IDS;

const symbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
};

const SubjectsLayer = (props) => {
  const { allowOverlap, mapUserLayoutConfig, onSubjectIconClick, subjects, subjectsOnActivePatrol, map, mapImages = {} } = props;

  const getSubjectLayer = (e, map) => map.queryRenderedFeatures(e.point, { layers: layerIds })[0];
  const [mapSubjectFeatures, setMapSubjectFeatures] = useState(featureCollection([]));
  const [layerIds, setLayerIds] = useState([]);

  const sourceData = {
    type: 'geojson',
    data: mapSubjectFeatures,
  };

  const sourceDataForActivePatrol = {
    type: 'geojson',
    data: subjectsOnActivePatrol,
  };

  const layoutConfig = allowOverlap ? {
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
    ...mapUserLayoutConfig,
  } : { ...mapUserLayoutConfig };

  useEffect(() => {
    subjects && addFeatureCollectionImagesToMap(subjects, map);
  }, [map, subjects]);

  useEffect(() => {
    setMapSubjectFeatures({
      ...subjects,
      features: subjects.features.filter((feature) => {
        return !!mapImages[
          calcImgIdFromUrlForMapImages(
            feature.properties.last_position 
              ? feature.properties.last_position.image 
              : (feature.properties.image || feature.properties.image_url)
            , feature.properties.width, feature.properties.height)
        ];
      }),
    });
  }, [subjects, mapImages]);

  const onSymbolClick = (event) => onSubjectIconClick(({ event, layer: getSubjectLayer(event, map) }));

  const layout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    ...layoutConfig,
  };

  return <Fragment>
    <Source id='subject-symbol-source' geoJsonSource={sourceData} />
    <LabeledSymbolLayer layout={layout} textPaint={symbolPaint} sourceId='subject-symbol-source' type='symbol'
      id={SUBJECT_SYMBOLS} onClick={onSymbolClick}
      onInit={setLayerIds}
    />
    <Source id='subjects-on-active-patrol-symbol-source' geoJsonSource={sourceDataForActivePatrol} />
    <LabeledPatrolSymbolLayer layout={layout} textPaint={symbolPaint} sourceId='subjects-on-active-patrol-symbol-source' type='symbol'
      id={'subjects-on-active-patrols'}
    />
  </Fragment>;
};

SubjectsLayer.propTypes = {
  subjects: PropTypes.object.isRequired,
  mapImages: PropTypes.object,
  onSubjectIconClick: PropTypes.func,
};

export default withMap(memo(withMapViewConfig(SubjectsLayer)));
