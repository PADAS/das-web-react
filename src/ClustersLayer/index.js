import React, { memo, useCallback, useContext, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { featureCollection } from '@turf/helpers';

import { addNewClusterMarkers, getRenderedClustersData, removeOldClusterMarkers } from './utils';
import { CLUSTERS_MAX_ZOOM, CLUSTERS_RADIUS, LAYER_IDS, SOURCE_IDS } from '../constants';
import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { getShouldEventsBeClustered, getShouldSubjectsBeClustered } from '../selectors/clusters';
import { MapContext } from '../App';
import useClusterBufferPolygon from '../hooks/useClusterBufferPolygon';
import { useMapEventBinding, useMapLayer, useMapSource } from '../hooks';

const {
  CLUSTERS_LAYER_ID,
} = LAYER_IDS;

const { CLUSTERS_SOURCE_ID } = SOURCE_IDS;

const CLUSTER_SOURCE_CONFIG = {
  cluster: true,
  clusterMaxZoom: CLUSTERS_MAX_ZOOM,
  clusterRadius: CLUSTERS_RADIUS,
  type: 'geojson',
};

const CLUSTER_LAYER_PAINT = { 'circle-radius': 0 };
const CLUSTER_LAYER_CONFIG = {
  filter: ['has', 'point_count']
};

const ClustersLayer = ({ onShowClusterSelectPopup }) => {
  const map = useContext(MapContext);

  const clusterMarkerHashMapRef = useRef({});

  const shouldEventsBeClustered = useSelector(getShouldEventsBeClustered);
  const shouldSubjectsBeClustered = useSelector(getShouldSubjectsBeClustered);
  const eventFeatureCollection = useSelector(getMapEventFeatureCollectionWithVirtualDate);
  const subjectFeatureCollection = useSelector(getMapSubjectFeatureCollectionWithVirtualPositioning);

  const clustersSourceData = useMemo(() => featureCollection(
    [
      ...(shouldEventsBeClustered ? eventFeatureCollection.features : []),
      ...(shouldSubjectsBeClustered ? subjectFeatureCollection.features : []),
    ]
  ), [
    eventFeatureCollection.features,
    shouldEventsBeClustered,
    shouldSubjectsBeClustered,
    subjectFeatureCollection.features,
  ]);

  useMapSource(CLUSTERS_SOURCE_ID, clustersSourceData, CLUSTER_SOURCE_CONFIG);
  useMapLayer(CLUSTERS_LAYER_ID, 'circle', CLUSTERS_SOURCE_ID, CLUSTER_LAYER_PAINT, null, CLUSTER_LAYER_CONFIG);

  const { removeClusterPolygon, renderClusterPolygon } = useClusterBufferPolygon();

  const mapImages = useSelector((state) => state.view.mapImages);

  const updateClusterMarkersCallback = useCallback(async () => {

    const {
      renderedClusterHashes,
      renderedClusterFeatures,
      renderedClusterIds,
    } = await getRenderedClustersData(map.getSource(CLUSTERS_SOURCE_ID), map);

    removeOldClusterMarkers(clusterMarkerHashMapRef, removeClusterPolygon, renderedClusterHashes);

    clusterMarkerHashMapRef.current = addNewClusterMarkers(
      clusterMarkerHashMapRef,
      CLUSTERS_SOURCE_ID,
      map,
      mapImages,
      removeClusterPolygon,
      renderClusterPolygon,
      renderedClusterFeatures,
      renderedClusterHashes,
      renderedClusterIds,
      onShowClusterSelectPopup);
  }, [map, mapImages,  onShowClusterSelectPopup, removeClusterPolygon, renderClusterPolygon]);

  const onSourceData = useMemo(() => (event) => {
    if (event.sourceId === CLUSTERS_SOURCE_ID) {
      updateClusterMarkersCallback();
    }
  }, [updateClusterMarkersCallback]);

  useMapEventBinding('sourcedata', onSourceData);

  return null;
};

ClustersLayer.propTypes = { onShowClusterSelectPopup: PropTypes.func.isRequired };

export default memo(ClustersLayer);