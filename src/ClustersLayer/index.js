import React, { useCallback, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import PropTypes from 'prop-types';

import { CLUSTERS_MAX_ZOOM, CLUSTERS_RADIUS, LAYER_IDS } from '../constants';
import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { showPopup } from '../ducks/popup';
import useClusterBufferPolygon from '../hooks/useClusterBufferPolygon';
import { withMap } from '../EarthRangerMap';

import {
  addNewClusterMarkers,
  getRenderedClustersData,
  recalculateClusterRadius,
  removeOldClusterMarkers,
} from './utils';

const {
  CLUSTER_BUFFER_POLYGON_LAYER_ID,
  CLUSTER_BUFFER_POLYGON_SOURCE_ID,
  CLUSTERS_LAYER_ID,
  CLUSTERS_SOURCE_ID,
} = LAYER_IDS;

export const UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME = 100;

const CLUSTER_BUFFER_POLYGON_LAYER_PAINT = {
  'fill-color': 'rgba(60, 120, 40, 0.4)',
  'fill-outline-color': 'rgba(20, 100, 25, 1)',
};
const CLUSTER_BUFFER_POLYGON_LAYER_CONFIGURATION = {
  before: CLUSTERS_LAYER_ID,
  id: CLUSTER_BUFFER_POLYGON_LAYER_ID,
  maxZoom: CLUSTERS_MAX_ZOOM - 1,
  paint: CLUSTER_BUFFER_POLYGON_LAYER_PAINT,
  source: CLUSTER_BUFFER_POLYGON_SOURCE_ID,
  type: 'fill',
};
const CLUSTER_BUFFER_POLYGON_SOURCE_CONFIGURATION = { type: 'geojson' };

const updateClusterMarkers = debounce(
  async (clusterMarkerHashMapRef, onShowClusterSelectPopup, map, removeClusterPolygon, renderClusterPolygon) => {
    const clustersSource = map.getSource(CLUSTERS_SOURCE_ID);
    const {
      renderedClusterFeatures,
      renderedClusterHashes,
      renderedClusterIds,
    } = await getRenderedClustersData(clustersSource, map);

    removeOldClusterMarkers(clusterMarkerHashMapRef, removeClusterPolygon, renderedClusterHashes);

    clusterMarkerHashMapRef.current = addNewClusterMarkers(
      clusterMarkerHashMapRef,
      clustersSource,
      map,
      removeClusterPolygon,
      renderClusterPolygon,
      renderedClusterFeatures,
      renderedClusterHashes,
      renderedClusterIds,
      onShowClusterSelectPopup
    );
  },
  UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME
);

const ClustersLayer = ({
  eventFeatureCollection,
  map,
  onEventClick,
  onSubjectClick,
  showPopup,
  subjectFeatureCollection,
}) => {
  const { removeClusterPolygon, renderClusterPolygon } = useClusterBufferPolygon(
    CLUSTER_BUFFER_POLYGON_LAYER_CONFIGURATION,
    CLUSTER_BUFFER_POLYGON_LAYER_ID,
    CLUSTER_BUFFER_POLYGON_SOURCE_CONFIGURATION,
    CLUSTER_BUFFER_POLYGON_SOURCE_ID
  );

  const clusterMarkerHashMapRef = useRef({});

  const onShowClusterSelectPopup = useCallback((layers, coordinates) => showPopup('cluster-select', {
    layers,
    coordinates,
    onSelectEvent: onEventClick,
    onSelectSubject: onSubjectClick,
  }), [onEventClick, onSubjectClick, showPopup]);

  useEffect(() => {
    if (map) {
      const sourceData = {
        features: [...eventFeatureCollection.features, ...subjectFeatureCollection.features],
        type: 'FeatureCollection',
      };

      const source = map.getSource(CLUSTERS_SOURCE_ID);
      if (source) {
        source.setData(sourceData);
      } else {
        map.addSource(CLUSTERS_SOURCE_ID, {
          type: 'geojson',
          data: sourceData,
          cluster: true,
          clusterMaxZoom: CLUSTERS_MAX_ZOOM,
          clusterRadius: CLUSTERS_RADIUS,
        });
      }

      const layer = map.getLayer(CLUSTERS_LAYER_ID);
      if (!layer) {
        map.addLayer({
          filter: ['has', 'point_count'],
          id: CLUSTERS_LAYER_ID,
          source: CLUSTERS_SOURCE_ID,
          type: 'circle',
          paint: { 'circle-radius': 0 },
        });
      }

      const onZoomEnd = () => {
        recalculateClusterRadius(map);
      };

      map.on('zoomend', onZoomEnd);

      updateClusterMarkers(
        clusterMarkerHashMapRef,
        onShowClusterSelectPopup,
        map,
        removeClusterPolygon,
        renderClusterPolygon
      );

      return () => {
        map.off('zoomend', onZoomEnd);
      };
    }
  }, [
    eventFeatureCollection.features,
    map,
    removeClusterPolygon,
    renderClusterPolygon,
    onShowClusterSelectPopup,
    subjectFeatureCollection.features
  ]);

  return null;
};

ClustersLayer.propTypes = {
  eventFeatureCollection: PropTypes.shape({
    features: PropTypes.array,
    type: PropTypes.string,
  }).isRequired,
  map: PropTypes.object.isRequired,
  onEventClick: PropTypes.func.isRequired,
  onSubjectClick: PropTypes.func.isRequired,
  showPopup: PropTypes.func.isRequired,
  subjectFeatureCollection: PropTypes.shape({
    features: PropTypes.array,
    type: PropTypes.string,
  }).isRequired,
};

const mapStatetoProps = (state) => ({
  eventFeatureCollection: getMapEventFeatureCollectionWithVirtualDate(state),
  subjectFeatureCollection: getMapSubjectFeatureCollectionWithVirtualPositioning(state),
});

export default connect(mapStatetoProps, { showPopup })(withMap(ClustersLayer));
