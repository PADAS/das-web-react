import { useCallback, useContext, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';
import { useDispatch, useSelector } from 'react-redux';

import {
  addNewClusterMarkers,
  getRenderedClustersData,
  recalculateClusterRadius,
  removeOldClusterMarkers,
} from './utils';
import { CLUSTERS_MAX_ZOOM, LAYER_IDS, REACT_APP_ENABLE_SUBJECTS_AND_EVENTS_CLUSTERING } from '../constants';
import { MapContext } from '../App';
import { getTimeSliderState } from '../selectors';
import { showPopup } from '../ducks/popup';
import useClusterBufferPolygon from '../hooks/useClusterBufferPolygon';

const UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME = 100;

const {
  CLUSTER_BUFFER_POLYGON_LAYER_ID,
  CLUSTER_BUFFER_POLYGON_SOURCE_ID,
  SUBJECTS_AND_EVENTS_CLUSTERS_LAYER_ID,
  SUBJECTS_AND_EVENTS_SOURCE_ID,
} = LAYER_IDS;

const CLUSTER_BUFFER_POLYGON_LAYER_PAINT = {
  'fill-color': 'rgba(60, 120, 40, 0.4)',
  'fill-outline-color': 'rgba(20, 100, 25, 1)',
};
const CLUSTER_BUFFER_POLYGON_LAYER_CONFIGURATION = {
  before: SUBJECTS_AND_EVENTS_CLUSTERS_LAYER_ID,
  id: CLUSTER_BUFFER_POLYGON_LAYER_ID,
  maxZoom: CLUSTERS_MAX_ZOOM - 1,
  paint: CLUSTER_BUFFER_POLYGON_LAYER_PAINT,
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

export default (onEventClick, onSubjectClick, source) => {
  const map = useContext(MapContext);

  const dispatch = useDispatch();

  const isTimeSliderActive = useSelector((state) => getTimeSliderState(state).active);

  const { removeClusterPolygon, renderClusterPolygon } = useClusterBufferPolygon(
    CLUSTER_BUFFER_POLYGON_LAYER_CONFIGURATION,
    CLUSTER_BUFFER_POLYGON_LAYER_ID,
    CLUSTER_BUFFER_POLYGON_SOURCE_CONFIGURATION,
    CLUSTER_BUFFER_POLYGON_SOURCE_ID
  );

  const clusterMarkerHashMapRef = useRef({});

  const onShowClusterSelectPopup = useCallback((layers, coordinates) => dispatch(
    showPopup('cluster-select', {
      layers,
      coordinates,
      onSelectEvent: onEventClick,
      onSelectSubject: onSubjectClick,
    })
  ), [dispatch, onEventClick, onSubjectClick]);

  useEffect(() => {
    if (source) {
      if (!map.getLayer(SUBJECTS_AND_EVENTS_CLUSTERS_LAYER_ID)) {
        map.addLayer({
          filter: ['has', 'point_count'],
          id: SUBJECTS_AND_EVENTS_CLUSTERS_LAYER_ID,
          source: SUBJECTS_AND_EVENTS_SOURCE_ID,
          type: 'circle',
          paint: { 'circle-radius': 0 },
        });
      }
    }
  }, [map, source]);

  useEffect(() => {
    const onZoomEnd = () => {
      recalculateClusterRadius(map);
    };
    map.on('zoomend', onZoomEnd);

    return () => {
      map.off('zoomend', onZoomEnd);
    };
  }, [map]);

  useEffect(() => {
    if (REACT_APP_ENABLE_SUBJECTS_AND_EVENTS_CLUSTERING) {
      map.setLayoutProperty(
        SUBJECTS_AND_EVENTS_CLUSTERS_LAYER_ID,
        'visibility',
        isTimeSliderActive ? 'none' : 'visible'
      );
    }
  }, [isTimeSliderActive, map]);

  const triggerUpdateClusterMarkers = useCallback(() => updateClusterMarkers(
    clusterMarkerHashMapRef,
    onShowClusterSelectPopup,
    map,
    removeClusterPolygon,
    renderClusterPolygon,
    source
  ), [map, onShowClusterSelectPopup, removeClusterPolygon, renderClusterPolygon, source]);

  return { updateClusterMarkers: triggerUpdateClusterMarkers };
};
