import React, { memo, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';

import { addNewClusterMarkers, getRenderedClustersData, removeOldClusterMarkers } from './utils';
import { CLUSTERS_MAX_ZOOM, CLUSTERS_RADIUS, LAYER_IDS, PREVIEW_FEATURES, SOURCE_IDS } from '../constants';
import { getMapEventSymbolPointsWithVirtualDate } from '../selectors/events';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { MapContext } from '../MapContext';
import { selectRealtimeOverlayFeatureCollection } from '../selectors/events-realtime-overlay';
import { selectShouldEventsBeClustered, selectShouldSubjectsBeClustered } from '../selectors/clusters';
import { subscribeEventIcons } from '../utils/eventMapIcons';
import useClusterPolygon from '../hooks/useClusterPolygon';
import { useMapEventBinding, usePreviewFeature } from '../hooks';
import useMapLayers from '../hooks/useMapLayers';
import useMapSources from '../hooks/useMapSources';
import useTileEventFeatures from '../hooks/useTileEventFeatures';

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
  const tileEventFeatures = useTileEventFeatures();

  const eventVectorTilesEnabled = usePreviewFeature(PREVIEW_FEATURES.EVENTS_VECTOR_TILES);

  const eventPointFeatureCollection = useSelector(getMapEventSymbolPointsWithVirtualDate);
  const realtimeOverlayFeatureCollection = useSelector(selectRealtimeOverlayFeatureCollection);
  const shouldEventsBeClustered = useSelector(selectShouldEventsBeClustered);
  const shouldSubjectsBeClustered = useSelector(selectShouldSubjectsBeClustered);
  const subjectFeatureCollection = useSelector(getMapSubjectFeatureCollectionWithVirtualPositioning);

  const clusterMarkerHashMapRef = useRef({});
  const latestClusterUpdateRunIdRef = useRef(0);

  const clustersSourceData = useMemo(() => {
    // Cluster the event features from both the tiles and realtime overlay.
    const eventFeatures = eventVectorTilesEnabled
      ? [...tileEventFeatures.features, ...realtimeOverlayFeatureCollection.features]
      : eventPointFeatureCollection.features;

    // Combine the event features and subject features to cluster them
    // together.
    return featureCollection([
      ...(shouldEventsBeClustered ? eventFeatures : []),
      ...(shouldSubjectsBeClustered ? subjectFeatureCollection.features : []),
    ]);
  }, [
    eventPointFeatureCollection,
    eventVectorTilesEnabled,
    realtimeOverlayFeatureCollection,
    shouldEventsBeClustered,
    shouldSubjectsBeClustered,
    subjectFeatureCollection.features,
    tileEventFeatures,
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

  const locallyEditedEvent = useSelector((state) => state.data.locallyEditedEvent);

  // Mirror frequently-changing values into refs so the callback stays stable; only read
  // inside the async callback/effects, never during render.
  const locallyEditedEventRef = useRef(locallyEditedEvent);
  const addClusterPolygonRef = useRef(addClusterPolygon);
  const removeClusterPolygonRef = useRef(removeClusterPolygon);
  const onShowClusterSelectPopupRef = useRef(onShowClusterSelectPopup);

  // Sync the refs after commit (never during render). This effect is declared
  // before the effects that invoke updateClusterMarkersCallback, so the refs
  // hold current values by the time those callbacks read them.
  useEffect(() => {
    locallyEditedEventRef.current = locallyEditedEvent;
    addClusterPolygonRef.current = addClusterPolygon;
    removeClusterPolygonRef.current = removeClusterPolygon;
    onShowClusterSelectPopupRef.current = onShowClusterSelectPopup;
  }, [addClusterPolygon, locallyEditedEvent, onShowClusterSelectPopup, removeClusterPolygon]);

  // Reads values from refs so its identity stays stable; only `map` is a real dep.
  const updateClusterMarkersCallback = useCallback(async () => {
    const clustersSource = map?.getSource(CLUSTERS_SOURCE_ID);
    if (!clustersSource) {
      return;
    }

    // Overlapping calls are expected; discard an older call that finishes after a newer one.
    const runId = ++latestClusterUpdateRunIdRef.current;

    const {
      renderedClusterHashes,
      renderedClusterFeatures,
      renderedClusterIds,
    } = await getRenderedClustersData(clustersSource, map, locallyEditedEventRef.current);

    if (runId !== latestClusterUpdateRunIdRef.current) {
      return;
    }

    removeOldClusterMarkers(clusterMarkerHashMapRef, removeClusterPolygonRef.current, renderedClusterHashes);

    clusterMarkerHashMapRef.current = addNewClusterMarkers(
      addClusterPolygonRef.current,
      clusterMarkerHashMapRef,
      CLUSTERS_SOURCE_ID,
      map,
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

  // Refresh markers when the locally edited event changes, including when it
  // transitions to null (a discarded edit) so the stale marker is rebuilt.
  useEffect(() => {
    updateClusterMarkersCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callback is stable via refs
  }, [locallyEditedEvent]);

  // sourcedata doesn't fire when an icon resolves, so refresh markers when the
  // event icon registry notifies that a new icon is available.
  useEffect(() => subscribeEventIcons(updateClusterMarkersCallback), [updateClusterMarkersCallback]);

  // On unmount, bump the run id so any in-flight async pass is discarded and
  // can't add markers after the component is gone. The mount-time rebuild is
  // already covered by the locallyEditedEvent effect above, which runs on mount
  // regardless of value, so this effect stays cleanup-only to avoid a redundant
  // duplicate pass.
  useEffect(() => () => {
    latestClusterUpdateRunIdRef.current += 1;
  }, []);

  return null;
};

export default memo(ClustersLayer);
