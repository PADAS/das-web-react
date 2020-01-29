import React, { memo, Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';
import { featureCollection } from '@turf/helpers';

import { calcUrlForImage } from '../utils/img';

import { addFeatureCollectionImagesToMap } from '../utils/map';

import { withMap } from '../EarthRangerMap';
import withMapNames from '../WithMapNames';

import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

const { SUBJECT_SYMBOLS } = LAYER_IDS;


const symbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
};


const getSubjectLayer = (e, map) => map.queryRenderedFeatures(e.point, { layers: [SUBJECT_SYMBOLS] })[0];

const SubjectsLayer = (props) => {
  const { allowOverlap, onSubjectIconClick, subjects, map, mapImages = {}, mapNameLayout, ...rest } = props;

  const [mapSubjectFeatures, setMapSubjectFeatures] = useState(featureCollection([]));

  const sourceData = {
    type: 'geojson',
    data: mapSubjectFeatures,
  };

  const layoutConfig = allowOverlap ? {
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
  } : {};

  useEffect(() => {
    subjects && addFeatureCollectionImagesToMap(subjects, map);
  }, [map, subjects]);

  useEffect(() => {
    setMapSubjectFeatures({
      ...subjects,
      features: subjects.features.filter((feature) => {
        return !!mapImages[
          calcUrlForImage(
            feature.properties.last_position ? feature.properties.last_position.image : feature.properties.image_url
          )
        ];
      }),
    });
  }, [subjects, mapImages]);

  const onSymbolClick = (e) => onSubjectIconClick(getSubjectLayer(e, map));

  const layout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    ...layoutConfig,
    ...mapNameLayout,
  };

  return <Fragment>
    <Source id='subject-symbol-source' geoJsonSource={sourceData} />
    <Layer sourceId='subject-symbol-source' type='symbol'
      id={SUBJECT_SYMBOLS} {...rest} onClick={onSymbolClick}
      paint={symbolPaint} layout={layout} />

  </Fragment>;
};

SubjectsLayer.propTypes = {
  subjects: PropTypes.object.isRequired,
  mapImages: PropTypes.object,
  onSubjectIconClick: PropTypes.func,
};

export default withMapNames(withMap(memo(SubjectsLayer)));
