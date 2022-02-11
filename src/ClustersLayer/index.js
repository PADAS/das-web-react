import React, { memo, useContext, useEffect, useMemo, useRef } from 'react';
import debounce from 'lodash/debounce';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { updateClusterMarkers } from './utils';
import { CLUSTERS_MAX_ZOOM, CLUSTERS_RADIUS, LAYER_IDS } from '../constants';
import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { getShouldEventsBeClustered, getShouldSubjectsBeClustered } from '../selectors/clusters';
import { MapContext } from '../App';
import useClusterBufferPolygon from '../hooks/useClusterBufferPolygon';

const {
  CLUSTER_BUFFER_POLYGON_LAYER_ID,
  CLUSTER_BUFFER_POLYGON_SOURCE_ID,
  CLUSTERS_LAYER_ID,
  CLUSTERS_SOURCE_ID,
} = LAYER_IDS;

const UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME = 75;

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

const debouncedClusterMarkerUpdate = debounce(updateClusterMarkers, UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME);

const ClustersLayer = ({ onShowClusterSelectPopup }) => {
  const map = useContext(MapContext);

  const clusterMarkerHashMapRef = useRef({});

  const { removeClusterPolygon, renderClusterPolygon } = useClusterBufferPolygon(
    CLUSTER_BUFFER_POLYGON_LAYER_CONFIGURATION,
    CLUSTER_BUFFER_POLYGON_LAYER_ID,
    CLUSTER_BUFFER_POLYGON_SOURCE_CONFIGURATION,
    CLUSTER_BUFFER_POLYGON_SOURCE_ID
  );

  const shouldEventsBeClustered = useSelector(getShouldEventsBeClustered);
  const shouldSubjectsBeClustered = useSelector(getShouldSubjectsBeClustered);
  const eventFeatureCollection = useSelector(getMapEventFeatureCollectionWithVirtualDate);
  const subjectFeatureCollection = useSelector(getMapSubjectFeatureCollectionWithVirtualPositioning);

  const clustersSourceData = useMemo(() => ({
    features: [
      ...(shouldEventsBeClustered ? eventFeatureCollection.features : []),
      ...(shouldSubjectsBeClustered ? subjectFeatureCollection.features : []),
    ],
    type: 'FeatureCollection',
  }), [
    eventFeatureCollection.features,
    shouldEventsBeClustered,
    shouldSubjectsBeClustered,
    subjectFeatureCollection.features,
  ]);

  useEffect(() => {
    if (map) {
      const clustersSource = map.getSource(CLUSTERS_SOURCE_ID);
      if (clustersSource) {
        clustersSource.setData(clustersSourceData);
      } else {
        map.addSource(CLUSTERS_SOURCE_ID, {
          cluster: true,
          clusterMaxZoom: CLUSTERS_MAX_ZOOM,
          clusterRadius: CLUSTERS_RADIUS,
          data: clustersSourceData,
          type: 'geojson',
        });
      }
    }
  }, [clustersSourceData, map]);

  useEffect(() => {
    if (!!map && !!map.getSource(CLUSTERS_SOURCE_ID) && !map.getLayer(CLUSTERS_LAYER_ID)) {
      map.addLayer({
        filter: ['has', 'point_count'],
        id: CLUSTERS_LAYER_ID,
        source: CLUSTERS_SOURCE_ID,
        type: 'circle',
        paint: { 'circle-radius': 0 },
      });
    }
  }, [map]);

  useEffect(() => {
    if (!!map && !!map.getSource(CLUSTERS_SOURCE_ID)) {
      const onSourceDataUpdated = (event) => {
        if (event.sourceId === CLUSTERS_SOURCE_ID) {
          debouncedClusterMarkerUpdate(
            clusterMarkerHashMapRef,
            onShowClusterSelectPopup,
            map,
            removeClusterPolygon,
            renderClusterPolygon,
            map.getSource(CLUSTERS_SOURCE_ID)
          );
        }
      };
      map.on('sourcedata', onSourceDataUpdated);

      return () => {
        map.off('sourcedata', onSourceDataUpdated);
      };
    }
  }, [map, onShowClusterSelectPopup, removeClusterPolygon, renderClusterPolygon]);

  return null;
};

ClustersLayer.propTypes = { onShowClusterSelectPopup: PropTypes.func.isRequired };

export default memo(ClustersLayer);
