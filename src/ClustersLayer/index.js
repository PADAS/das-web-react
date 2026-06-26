import React, { memo, useCallback, useContext, useMemo, useRef } from 'react';
import { featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';

import { addNewClusterMarkers, getRenderedClustersData, removeOldClusterMarkers } from './utils';
import { CLUSTERS_MAX_ZOOM, CLUSTERS_RADIUS, FEATURE_FLAGS, LAYER_IDS, SOURCE_IDS } from '../constants';
import { getMapEventSymbolPointsWithVirtualDate } from '../selectors/events';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { MapContext } from '../MapContext';
import { selectRealtimeOverlayFeatureCollection } from '../selectors/events-realtime-overlay';
import { selectShouldEventsBeClustered, selectShouldSubjectsBeClustered } from '../selectors/clusters';
import useClusterPolygon from '../hooks/useClusterPolygon';
import { useFeatureFlag, useMapEventBinding } from '../hooks';
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

  const clusterMarkerHashMapRef = useRef({});

  const eventPointFeatureCollection = useSelector(getMapEventSymbolPointsWithVirtualDate);
  const realtimeOverlayFeatureCollection = useSelector(selectRealtimeOverlayFeatureCollection);
  const shouldEventsBeClustered = useSelector(selectShouldEventsBeClustered);
  const shouldSubjectsBeClustered = useSelector(selectShouldSubjectsBeClustered);
  const subjectFeatureCollection = useSelector(getMapSubjectFeatureCollectionWithVirtualPositioning);

  const useEventVectorTiles = useFeatureFlag(FEATURE_FLAGS.EVENTS_VECTOR_TILES);
  // Tile event points read back from the rendered vector tiles (normalized to the GeoJSON shape).
  const tileEventFeatures = useTileEventFeatures();

  const clustersSourceData = useMemo(() => {
    const eventFeatures = useEventVectorTiles
      ? [...tileEventFeatures.features, ...realtimeOverlayFeatureCollection.features]
      : eventPointFeatureCollection.features;

    return featureCollection([
      ...(shouldEventsBeClustered ? eventFeatures : []),
      ...(shouldSubjectsBeClustered ? subjectFeatureCollection.features : []),
    ]);
  }, [
    eventPointFeatureCollection,
    realtimeOverlayFeatureCollection,
    shouldEventsBeClustered,
    shouldSubjectsBeClustered,
    subjectFeatureCollection.features,
    tileEventFeatures,
    useEventVectorTiles,
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

    const {
      renderedClusterHashes,
      renderedClusterFeatures,
      renderedClusterIds,
    } = await getRenderedClustersData(map.getSource(CLUSTERS_SOURCE_ID), map);

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

  const onSourceData = useMemo(() => (event) => {
    if (event.sourceId === CLUSTERS_SOURCE_ID) {
      updateClusterMarkersCallback();
    }
  }, [updateClusterMarkersCallback]);

  useMapEventBinding('sourcedata', onSourceData);

  return null;
};

export default memo(ClustersLayer);
