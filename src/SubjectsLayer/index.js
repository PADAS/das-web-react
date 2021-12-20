import React, { memo, Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Source } from 'react-mapbox-gl';
import { featureCollection } from '@turf/helpers';

import { addFeatureCollectionImagesToMap } from '../utils/map';

import { withMap } from '../EarthRangerMap';
import withMapViewConfig from '../WithMapViewConfig';
import { CLUSTERS_MAX_ZOOM, CLUSTERS_RADIUS, FEATURE_FLAGS, LAYER_IDS } from '../constants';
import { useFeatureFlag } from '../hooks';

import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';

const { SUBJECT_SYMBOLS } = LAYER_IDS;

const SubjectsLayer = ({ onSubjectIconClick, subjects, map, mapImages = {} }) => {
  const clusteringFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.CLUSTERING);

  const getSubjectLayer = (e, map) => map.queryRenderedFeatures(e.point, { layers: layerIds })[0];
  const [mapSubjectFeatures, setMapSubjectFeatures] = useState(featureCollection([]));
  const [layerIds, setLayerIds] = useState([]);

  const sourceData = {
    type: 'geojson',
    data: mapSubjectFeatures,
    ...(clusteringFeatureFlagEnabled ?
      {
        cluster: true,
        clusterMaxZoom: CLUSTERS_MAX_ZOOM,
        clusterRadius: CLUSTERS_RADIUS,
      }:
      {}
    ),
  };

  useEffect(() => {
    if (!!subjects?.features?.length) {
      addFeatureCollectionImagesToMap(subjects);
    }
  }, [map, subjects]);

  useEffect(() => {
    setMapSubjectFeatures({
      ...subjects,
    });
  }, [subjects, mapImages]);

  const onSymbolClick = (event) => onSubjectIconClick(({ event, layer: getSubjectLayer(event, map) }));

  return <Fragment>
    <Source id='subject-symbol-source' geoJsonSource={sourceData} />
    <LabeledPatrolSymbolLayer sourceId='subject-symbol-source' type='symbol'
      id={SUBJECT_SYMBOLS} onClick={onSymbolClick}
      onInit={setLayerIds}
      {...(clusteringFeatureFlagEnabled ? { filter: ['!has', 'point_count'] } : {})}
    />
  </Fragment>;
};

SubjectsLayer.propTypes = {
  subjects: PropTypes.object.isRequired,
  mapImages: PropTypes.object,
  onSubjectIconClick: PropTypes.func,
};

export default withMap(memo(withMapViewConfig(SubjectsLayer)));
