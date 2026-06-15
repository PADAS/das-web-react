import React, { memo, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';

import { addNewClusterMarkers, getRenderedClustersData, removeOldClusterMarkers } from './utils';
import { CLUSTERS_MAX_ZOOM, CLUSTERS_RADIUS, LAYER_IDS, SOURCE_IDS } from '../constants';
import { getMapEventSymbolPointsWithVirtualDate } from '../selectors/events';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { selectShouldEventsBeClustered, selectShouldSubjectsBeClustered } from '../selectors/clusters';
import { MapContext } from '../App';
import useClusterPolygon from '../hooks/useClusterPolygon';
import { useMapEventBinding } from '../hooks';
import useMapSources from '../hooks/useMapSources';
import useMapLayers from '../hooks/useMapLayers';

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

  const eventPointFeatureCollection = useSelector(getMapEventSymbolPointsWithVirtualDate);
  const shouldEventsBeClustered = useSelector(selectShouldEventsBeClustered);
  const shouldSubjectsBeClustered = useSelector(selectShouldSubjectsBeClustered);
  const subjectFeatureCollection = useSelector(getMapSubjectFeatureCollectionWithVirtualPositioning);

  const clustersSourceData = useMemo(() => featureCollection(
    [
      ...(shouldEventsBeClustered ? eventPointFeatureCollection.features : []),
      ...(shouldSubjectsBeClustered ? subjectFeatureCollection.features : []),
    ]
  ), [
    eventPointFeatureCollection,
    shouldEventsBeClustered,
    shouldSubjectsBeClustered,
    subjectFeatureCollection.features,
  ]);

  useMapSources([{ id: CLUSTERS_SOURCE_ID, data: clustersSourceData }], CLUSTER_SOURCE_CONFIG);
  useMapLayers([{
    id: CLUSTERS_LAYER_ID,
    type: 'circle',
    sourceId: CLUSTERS_SOURCE_ID,
    paint: CLUSTER_LAYER_PAINT,
    options: CLUSTER_LAYER_CONFIG
  }]);

  const { addClusterPolygon, removeClusterPolygon } = useClusterPolygon();

  const mapImages = useSelector((state) => state.view.mapImages);
  const locallyEditedEvent = useSelector((state) => state.data.locallyEditedEvent);

  // Use refs so the callback doesn't need to be recreated when these frequently-changing
  // values update — their respective effects (and sourcedata) drive the marker refresh,
  // and the callback reads the latest values from the refs at call time.
  const mapImagesRef = useRef(mapImages);
  mapImagesRef.current = mapImages;

  const locallyEditedEventRef = useRef(locallyEditedEvent);
  locallyEditedEventRef.current = locallyEditedEvent;

  const addClusterPolygonRef = useRef(addClusterPolygon);
  addClusterPolygonRef.current = addClusterPolygon;

  const removeClusterPolygonRef = useRef(removeClusterPolygon);
  removeClusterPolygonRef.current = removeClusterPolygon;

  const onShowClusterSelectPopupRef = useRef(onShowClusterSelectPopup);
  onShowClusterSelectPopupRef.current = onShowClusterSelectPopup;

  // The callback intentionally reads these values from refs so its identity stays stable
  // across frequent locallyEditedEvent/mapImages/etc. changes; only `map` is a real dep.
  const updateClusterMarkersCallback = useCallback(async () => {
    const {
      renderedClusterHashes,
      renderedClusterFeatures,
      renderedClusterIds,
    } = await getRenderedClustersData(map.getSource(CLUSTERS_SOURCE_ID), map, locallyEditedEventRef.current, mapImagesRef.current);

    removeOldClusterMarkers(clusterMarkerHashMapRef, removeClusterPolygonRef.current, renderedClusterHashes);

    clusterMarkerHashMapRef.current = addNewClusterMarkers(
      addClusterPolygonRef.current,
      clusterMarkerHashMapRef,
      CLUSTERS_SOURCE_ID,
      map,
      mapImagesRef.current,
      removeClusterPolygonRef.current,
      renderedClusterFeatures,
      renderedClusterHashes,
      renderedClusterIds,
      onShowClusterSelectPopupRef.current,
      locallyEditedEventRef.current);
  }, [map]);

  const onSourceData = useMemo(() => (event) => {
    if (event.sourceId === CLUSTERS_SOURCE_ID) {
      updateClusterMarkersCallback();
    }
  }, [updateClusterMarkersCallback]);

  useMapEventBinding('sourcedata', onSourceData);

  // updateClusterMarkersCallback is stable (reads current values from refs), so it is
  // intentionally omitted from the deps to avoid re-firing on its identity churn.
  useEffect(() => {
    if (locallyEditedEvent) {
      updateClusterMarkersCallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locallyEditedEvent]);

  // Trigger a marker refresh when mapImages changes so clusters show the correct icon
  // as soon as the image is available (sourcedata doesn't fire on mapImages updates).
  // updateClusterMarkersCallback is stable, so it is intentionally omitted from the deps.
  useEffect(() => {
    updateClusterMarkersCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapImages]);

  return null;
};

export default memo(ClustersLayer);
