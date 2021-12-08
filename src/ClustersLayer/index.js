import React from 'react';
import { connect } from 'react-redux';
import { Layer, Source } from 'react-mapbox-gl';
import PropTypes from 'prop-types';

import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { LAYER_IDS, MAX_ZOOM } from '../constants';
import useClusterMarkers from './useClusterMarkers';
import { withMap } from '../EarthRangerMap';

const { CLUSTERS_LAYER_ID } = LAYER_IDS;

const ClustersLayer = ({
  eventFeatureCollection,
  map,
  onEventClick,
  onSubjectClick,
  subjectFeatureCollection
}) => {
  useClusterMarkers(map, onEventClick, onSubjectClick);

  const sourceData = {
    type: 'geojson',
    data: {
      features: [...eventFeatureCollection.features, ...subjectFeatureCollection.features],
      type: 'FeatureCollection',
    },
    cluster: true,
    clusterMaxZoom: MAX_ZOOM - 1,
    clusterRadius: 40,
  };

  return <>
    <Source id='clusters-source' geoJsonSource={sourceData} />

    <Layer
      filter={['has', 'point_count']}
      id={CLUSTERS_LAYER_ID}
      paint={{ 'circle-radius': 0 }}
      sourceId='clusters-source'
      type='circle'
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
};

const mapStatetoProps = (state) => ({
  eventFeatureCollection: getMapEventFeatureCollectionWithVirtualDate(state),
  subjectFeatureCollection: getMapSubjectFeatureCollectionWithVirtualPositioning(state),
});

export default connect(mapStatetoProps)(withMap(ClustersLayer));
