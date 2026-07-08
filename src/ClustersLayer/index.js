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

  const mapImages = useSelector((state) => state.view.mapImages);
  const locallyEditedEvent = useSelector((state) => state.data.locallyEditedEvent);

  // Mirror frequently-changing values into refs so the callback stays stable; only read
  // inside the async callback/effects, never during render.
  const mapImagesRef = useRef(mapImages);
  // eslint-disable-next-line react-hooks/refs -- render-phase write is safe; only read in async callback
  mapImagesRef.current = mapImages;

  const locallyEditedEventRef = useRef(locallyEditedEvent);
  // eslint-disable-next-line react-hooks/refs -- render-phase write is safe; only read in async callback
  locallyEditedEventRef.current = locallyEditedEvent;

  const addClusterPolygonRef = useRef(addClusterPolygon);
  // eslint-disable-next-line react-hooks/refs -- render-phase write is safe; only read in async callback
  addClusterPolygonRef.current = addClusterPolygon;

  const removeClusterPolygonRef = useRef(removeClusterPolygon);
  // eslint-disable-next-line react-hooks/refs -- render-phase write is safe; only read in async callback
  removeClusterPolygonRef.current = removeClusterPolygon;

  const onShowClusterSelectPopupRef = useRef(onShowClusterSelectPopup);
  // eslint-disable-next-line react-hooks/refs -- render-phase write is safe; only read in async callback
  onShowClusterSelectPopupRef.current = onShowClusterSelectPopup;

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

  useEffect(() => {
    if (locallyEditedEvent) {
      updateClusterMarkersCallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callback is stable via refs
  }, [locallyEditedEvent]);

  // sourcedata doesn't fire on mapImages updates, so refresh markers when icons resolve.
  useEffect(() => {
    updateClusterMarkersCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callback is stable via refs
  }, [mapImages]);

  return null;
};

export default memo(ClustersLayer);
