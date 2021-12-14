import React from 'react';
import { connect } from 'react-redux';
import explode from '@turf/explode';
import { Layer, Source } from 'react-mapbox-gl';
import PropTypes from 'prop-types';

import { getFeatureSetFeatureCollectionsByType } from '../selectors';
import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { LAYER_IDS, MAX_ZOOM } from '../constants';
import useClusterMarkers from './useClusterMarkers';
import { withMap } from '../EarthRangerMap';

const { CLUSTERS_LAYER_ID } = LAYER_IDS;

const clusterPolyPaint = {
  'fill-color': 'rgba(60, 120, 40, 0.4)',
  'fill-outline-color': 'rgba(20, 100, 25, 1)',
};

const ClustersLayer = ({
  eventFeatureCollection,
  map,
  onEventClick,
  onSubjectClick,
  onSymbolClick,
  subjectFeatureCollection,
  symbolFeatureCollection,
}) => {
  const { clusterBufferPolygon } = useClusterMarkers(map, MAX_ZOOM - 1, onEventClick, onSubjectClick, onSymbolClick);

  // TODO: I'm considering symbol features are always multipoint, is that correct?
  const pointSymbolFeatures = symbolFeatureCollection.features.reduce(
    (pointSymbolFeatures, multiPointFeature) => [...pointSymbolFeatures, ...explode(multiPointFeature).features],
    []
  );

  const sourceData = {
    type: 'geojson',
    data: {
      features: [...eventFeatureCollection.features, ...subjectFeatureCollection.features, ...pointSymbolFeatures],
      type: 'FeatureCollection',
    },
    cluster: true,
    clusterMaxZoom: MAX_ZOOM - 1,
    clusterRadius: 40,
  };

  const clusterBufferData = {
    data: clusterBufferPolygon,
    type: 'geojson',
  };

  return <>
    <Source id='clusters-source' geoJsonSource={sourceData} />
    <Source id='cluster-buffer-polygon-data' geoJsonSource={clusterBufferData} />

    <Layer
      filter={['has', 'point_count']}
      id={CLUSTERS_LAYER_ID}
      paint={{ 'circle-radius': 0 }}
      sourceId='clusters-source'
      type='circle'
    />
    <Layer
      before={CLUSTERS_LAYER_ID}
      id='cluster-polygon'
      maxZoom={MAX_ZOOM - 2}
      paint={clusterPolyPaint}
      sourceId='cluster-buffer-polygon-data'
      type='fill'
    />
  </>;
};

ClustersLayer.propTypes = {
  eventFeatureCollection: PropTypes.shape({
    features: PropTypes.array,
    type: PropTypes.string,
  }).isRequired,
  map: PropTypes.object.isRequired,
  onEventClick: PropTypes.func.isRequired,
  onSubjectClick: PropTypes.func.isRequired,
  subjectFeatureCollection: PropTypes.shape({
    features: PropTypes.array,
    type: PropTypes.string,
  }).isRequired,
  symbolFeatures: PropTypes.shape({
    features: PropTypes.array,
    type: PropTypes.string,
  }).isRequired,
};

const mapStatetoProps = (state) => ({
  eventFeatureCollection: getMapEventFeatureCollectionWithVirtualDate(state),
  subjectFeatureCollection: getMapSubjectFeatureCollectionWithVirtualPositioning(state),
  symbolFeatureCollection: getFeatureSetFeatureCollectionsByType(state).symbolFeatures,
});

export default connect(mapStatetoProps)(withMap(ClustersLayer));
