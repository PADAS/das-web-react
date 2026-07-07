import React, { memo, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';

import { addNewClusterMarkers, getRenderedClustersData, removeOldClusterMarkers } from './utils';
import {
  CLUSTER_ICON_UPDATE_DEBOUNCE_MS,
  CLUSTERS_MAX_ZOOM,
  CLUSTERS_RADIUS,
  LAYER_IDS,
  PREVIEW_FEATURES,
  SOURCE_IDS,
} from '../constants';
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
  const mapImagesUpdateTimeoutRef = useRef(null);

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

  const updateClusterMarkersCallback = useCallback(async () => {
    const clustersSource = map?.getSource(CLUSTERS_SOURCE_ID);
    if (!clustersSource) {
      return;
    }

    // mapImages re-triggers this on every icon resolved, so overlapping calls
    // are expected. If an older call's async work finishes after a newer one,
    // discard it.
    const runId = ++latestClusterUpdateRunIdRef.current;

    const {
      renderedClusterHashes,
      renderedClusterFeatures,
      renderedClusterIds,
    } = await getRenderedClustersData(clustersSource, map);

    if (runId !== latestClusterUpdateRunIdRef.current) {
      return;
    }

    removeOldClusterMarkers(clusterMarkerHashMapRef, removeClusterPolygon, renderedClusterHashes);

    clusterMarkerHashMapRef.current = addNewClusterMarkers(
      addClusterPolygon,
      clusterMarkerHashMapRef,
      CLUSTERS_SOURCE_ID,
      map,
      mapImages,
      removeClusterPolygon,
      renderedClusterFeatures,
      renderedClusterHashes,
      renderedClusterIds,
      onShowClusterSelectPopup);
  }, [addClusterPolygon, map, mapImages,  onShowClusterSelectPopup, removeClusterPolygon]);

  useEffect(() => {
    // Re-run the update pass whenever it changes so clusters built with
    // missing icons pick up the real ones when mapImages resolves. Skip the
    // requery entirely once no tracked cluster needs one.
    const hasClusterAwaitingIcons = Object.values(clusterMarkerHashMapRef.current)
      .some((entry) => !entry.iconsReady);

    if (!hasClusterAwaitingIcons) {
      return undefined;
    }

    clearTimeout(mapImagesUpdateTimeoutRef.current);
    mapImagesUpdateTimeoutRef.current = setTimeout(updateClusterMarkersCallback, CLUSTER_ICON_UPDATE_DEBOUNCE_MS);

    return () => clearTimeout(mapImagesUpdateTimeoutRef.current);
  }, [updateClusterMarkersCallback]);

  const onSourceData = useMemo(() => (event) => {
    if (event.sourceId === CLUSTERS_SOURCE_ID) {
      updateClusterMarkersCallback();
    }
  }, [updateClusterMarkersCallback]);

  useMapEventBinding('sourcedata', onSourceData);

  return null;
};

export default memo(ClustersLayer);
