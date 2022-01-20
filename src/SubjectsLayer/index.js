import React, { memo, Fragment, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Source } from 'react-mapbox-gl';
import { featureCollection } from '@turf/helpers';

import { addFeatureCollectionImagesToMap } from '../utils/map';
import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';

import { withMap } from '../EarthRangerMap';
import withMapViewConfig from '../WithMapViewConfig';
import { REACT_APP_ENABLE_CLUSTERING, CLUSTERS_MAX_ZOOM, CLUSTERS_RADIUS, LAYER_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';

import LabeledPatrolSymbolLayer from '../LabeledPatrolSymbolLayer';

const { SUBJECT_SYMBOLS } = LAYER_IDS;

const SubjectsLayer = ({ onSubjectIconClick, subjects, map, eventFeatureCollection }) => {
  const getSubjectLayer = (e, map) => map.queryRenderedFeatures(e.point, { layers: layerIds })[0];
  const [mapSubjectFeatures, setMapSubjectFeatures] = useState(featureCollection([]));
  const [layerIds, setLayerIds] = useState([]);

  const sourceData = {
    type: 'geojson',
    data: {
      features: [...eventFeatureCollection.features, ...mapSubjectFeatures.features],
      type: 'FeatureCollection',
    },
    ...(REACT_APP_ENABLE_CLUSTERING ?
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
  }, [subjects]);

  const onSymbolClick = (event) => onSubjectIconClick(({ event, layer: getSubjectLayer(event, map) }));

  return <Fragment>
    <Source id='subject-symbol-source' geoJsonSource={sourceData} />
    <LabeledPatrolSymbolLayer sourceId='subject-symbol-source' type='symbol'
      id={SUBJECT_SYMBOLS} onClick={onSymbolClick}
      onInit={setLayerIds}
      filter={['==', ['get', 'content_type'], SUBJECT_FEATURE_CONTENT_TYPE]}
    />
  </Fragment>;
};

const mapStatetoProps = (state) => ({
  eventFeatureCollection: getMapEventFeatureCollectionWithVirtualDate(state),
});

SubjectsLayer.propTypes = {
  subjects: PropTypes.object.isRequired,
  onSubjectIconClick: PropTypes.func,
};

export default connect(mapStatetoProps)(withMap(memo(withMapViewConfig(SubjectsLayer))));
