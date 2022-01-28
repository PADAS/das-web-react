import React, { memo, useContext, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import {
  addNewClusterMarkers,
  getRenderedClustersData,
  recalculateClusterRadius,
  removeOldClusterMarkers,
  useSourcesData,
} from './utils';
import { CLUSTERS_MAX_ZOOM, CLUSTERS_RADIUS, LAYER_IDS } from '../constants';
import { getTimeSliderState } from '../selectors';
import { MapContext } from '../App';
import useClusterBufferPolygon from '../hooks/useClusterBufferPolygon';

const {
  CLUSTER_BUFFER_POLYGON_LAYER_ID,
  CLUSTER_BUFFER_POLYGON_SOURCE_ID,
  CLUSTERED_DATA_SOURCE_ID,
  CLUSTERS_LAYER_ID,
  UNCLUSTERED_DATA_SOURCE_ID,
} = LAYER_IDS;

const UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME = 100;

const CLUSTER_BUFFER_POLYGON_LAYER_CONFIGURATION = {
  before: CLUSTERS_LAYER_ID,
  id: CLUSTER_BUFFER_POLYGON_LAYER_ID,
  maxZoom: CLUSTERS_MAX_ZOOM - 1,
  paint: {
    'fill-color': 'rgba(60, 120, 40, 0.4)',
    'fill-outline-color': 'rgba(20, 100, 25, 1)',
  },
  source: CLUSTER_BUFFER_POLYGON_SOURCE_ID,
  type: 'fill',
};
const CLUSTER_BUFFER_POLYGON_SOURCE_CONFIGURATION = { type: 'geojson' };

const updateClusterMarkers = debounce(async (
  clusterMarkerHashMapRef,
  onShowClusterSelectPopup,
  map,
  removeClusterPolygon,
  renderClusterPolygon,
  source
) => {
  const {
    renderedClusterFeatures,
    renderedClusterHashes,
    renderedClusterIds,
  } = await getRenderedClustersData(source, map);

  removeOldClusterMarkers(clusterMarkerHashMapRef, removeClusterPolygon, renderedClusterHashes);

  clusterMarkerHashMapRef.current = addNewClusterMarkers(
    clusterMarkerHashMapRef,
    source,
    map,
    removeClusterPolygon,
    renderClusterPolygon,
    renderedClusterFeatures,
    renderedClusterHashes,
    renderedClusterIds,
    onShowClusterSelectPopup
  );
}, UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME);

const ClustersLayer = ({ onShowClusterSelectPopup }) => {
  const map = useContext(MapContext);

  const clusterMarkerHashMapRef = useRef({});

  const isTimeSliderActive = useSelector((state) => getTimeSliderState(state).active);

  const clusteredSource = map.getSource(CLUSTERED_DATA_SOURCE_ID);
  const unclusteredSource = map.getSource(UNCLUSTERED_DATA_SOURCE_ID);

  const { removeClusterPolygon, renderClusterPolygon } = useClusterBufferPolygon(
    CLUSTER_BUFFER_POLYGON_LAYER_CONFIGURATION,
    CLUSTER_BUFFER_POLYGON_LAYER_ID,
    CLUSTER_BUFFER_POLYGON_SOURCE_CONFIGURATION,
    CLUSTER_BUFFER_POLYGON_SOURCE_ID
  );

  const { clusteredSourceData, unclusteredSourceData } = useSourcesData();

  useEffect(() => {
    if (map) {
      if (clusteredSource) {
        clusteredSource.setData(clusteredSourceData);
      } else {
        map.addSource(CLUSTERED_DATA_SOURCE_ID, {
          cluster: true,
          clusterMaxZoom: CLUSTERS_MAX_ZOOM,
          clusterRadius: CLUSTERS_RADIUS,
          data: clusteredSourceData,
          type: 'geojson',
        });
      }

      updateClusterMarkers(
        clusterMarkerHashMapRef,
        onShowClusterSelectPopup,
        map,
        removeClusterPolygon,
        renderClusterPolygon,
        clusteredSource
      );
    }
  }, [
    clusteredSource,
    clusteredSourceData,
    map,
    onShowClusterSelectPopup,
    removeClusterPolygon,
    renderClusterPolygon,
  ]);

  useEffect(() => {
    if (map) {
      if (unclusteredSource) {
        unclusteredSource.setData(unclusteredSourceData);
      } else {
        map.addSource(UNCLUSTERED_DATA_SOURCE_ID, { data: unclusteredSourceData, type: 'geojson' });
      }
    }
  }, [map, unclusteredSource, unclusteredSourceData]);

  useEffect(() => {
    if (clusteredSource) {
      if (!map.getLayer(CLUSTERS_LAYER_ID)) {
        map.addLayer({
          filter: ['has', 'point_count'],
          id: CLUSTERS_LAYER_ID,
          source: CLUSTERED_DATA_SOURCE_ID,
          type: 'circle',
          paint: { 'circle-radius': 0 },
        });
      }
    }
  }, [clusteredSource, map]);

  useEffect(() => {
    const onZoomEnd = () => recalculateClusterRadius(map);
    map.on('zoomend', onZoomEnd);

    return () => {
      map.off('zoomend', onZoomEnd);
    };
  }, [map]);

  useEffect(() => {
    map.setLayoutProperty(
      CLUSTERS_LAYER_ID,
      'visibility',
      isTimeSliderActive ? 'none' : 'visible'
    );
  }, [isTimeSliderActive, map]);

  return null;
};

ClustersLayer.propTypes = { onShowClusterSelectPopup: PropTypes.func.isRequired };

export default memo(ClustersLayer);
