import React, { useCallback, useEffect, useRef } from 'react';
import centroid from '@turf/centroid';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import explode from '@turf/explode';
import { featureCollection } from '@turf/helpers';
import mapboxgl from 'mapbox-gl';
import PropTypes from 'prop-types';

import {
  CLUSTER_CLICK_ZOOM_THRESHOLD,
  CLUSTERS_MAX_ZOOM,
  CLUSTERS_RADIUS,
  LAYER_IDS,
  SUBJECT_FEATURE_CONTENT_TYPE,
} from '../constants';
import { getFeatureSetFeatureCollectionsByType } from '../selectors';
import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { hashCode } from '../utils/string';
import { injectStylesToElement } from '../utils/styles';
import { showPopup } from '../ducks/popup';
import useClusterBufferPolygon from '../hooks/useClusterBufferPolygon';
import { withMap } from '../EarthRangerMap';

const {
  CLUSTER_BUFFER_POLYGON_LAYER_ID,
  CLUSTER_BUFFER_POLYGON_SOURCE_ID,
  CLUSTERS_LAYER_ID,
  CLUSTERS_SOURCE_ID,
} = LAYER_IDS;

export const UPDATE_CLUSTER_MARKERS_DEBOUNCE_TIME = 150;

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

const CLUSTER_ICON_DISPLAY_LENGTH = 3;

const CLUSTER_HTML_MARKER_CONTAINER_STYLES = {
  display: 'flex',
  flexDirection: 'row',
  aligntItems: 'center',
  borderRadius: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  padding: '4px 10px',
  cursor: 'pointer',
};
const FEATURE_ICON_HTML_STYLES = { width: '16px', height: '24px' };
const FEATURE_COUNT_HTML_STYLES = { fontSize: '16px', fontWeight: '500', paddingLeft: '4px', margin: '0' };

export const getClusterIconFeatures = (clusterFeatures) => {
  const { eventFeatures, subjectFeatures, symbolFeatures } = clusterFeatures.reduce((accumulator, feature) => {
    if (feature.properties?.content_type === SUBJECT_FEATURE_CONTENT_TYPE) {
      return { ...accumulator, subjectFeatures: [...accumulator.subjectFeatures, feature] };
    }
    if (feature.properties?.event_type) {
      return { ...accumulator, eventFeatures: [...accumulator.eventFeatures, feature] };
    }
    return { ...accumulator, symbolFeatures: [...accumulator.symbolFeatures, feature] };
  }, { eventFeatures: [], subjectFeatures: [], symbolFeatures: [] });

  eventFeatures.sort((firstFeature, secondFeature) => {
    if (firstFeature.properties.priority < secondFeature.properties.priority) return -1;
    if (firstFeature.properties.priority > secondFeature.properties.priority) return 1;
    return firstFeature.properties.updated_at > secondFeature.properties.updated_at ? -1 : 1;
  });

  subjectFeatures.sort((firstFeature, secondFeature) => {
    const firstFeatureLastPositionDate = firstFeature.properties.last_position_date || '';
    const firstFeatureRadioStateAt = firstFeature.properties.radio_state_at || '';
    const firstFeatureLastUpdate = firstFeatureLastPositionDate > firstFeatureRadioStateAt
      ? firstFeatureLastPositionDate
      : firstFeatureRadioStateAt;

    const secondFeatureLastPositionDate = secondFeature.properties.last_position_date || '';
    const secondFeatureRadioStateAt = secondFeature.properties.radio_state_at || '';
    const secondFeatureLastUpdate = secondFeatureLastPositionDate > secondFeatureRadioStateAt
      ? secondFeatureLastPositionDate
      : secondFeatureRadioStateAt;

    return firstFeatureLastUpdate < secondFeatureLastUpdate ? 1 : -1;
  });

  const clusterIconFeatures = [];
  let featureIndex = 0;
  while (clusterIconFeatures.length < Math.min(clusterFeatures.length, CLUSTER_ICON_DISPLAY_LENGTH)) {
    if (!!subjectFeatures?.[featureIndex]) clusterIconFeatures.push(subjectFeatures[featureIndex]);
    if (!!eventFeatures?.[featureIndex]) clusterIconFeatures.push(eventFeatures[featureIndex]);
    if (!!symbolFeatures?.[featureIndex]) clusterIconFeatures.push(symbolFeatures[featureIndex]);
    featureIndex++;
  }

  return clusterIconFeatures.slice(0, CLUSTER_ICON_DISPLAY_LENGTH);
};

export const createClusterHTMLMarker = (clusterFeatures, onClusterClick, onMouseOverCluster, onMouseLeaveCluster) => {
  const clusterHTMLMarkerContainer = document.createElement('div');
  clusterHTMLMarkerContainer.onclick = onClusterClick;
  clusterHTMLMarkerContainer.onmouseover = onMouseOverCluster;
  clusterHTMLMarkerContainer.onmouseleave = onMouseLeaveCluster;
  injectStylesToElement(clusterHTMLMarkerContainer, CLUSTER_HTML_MARKER_CONTAINER_STYLES);

  getClusterIconFeatures(clusterFeatures).forEach((feature) => {
    const featureImageHTML = document.createElement('img');
    featureImageHTML.src = feature.properties.image;
    injectStylesToElement(featureImageHTML, FEATURE_ICON_HTML_STYLES);
    clusterHTMLMarkerContainer.appendChild(featureImageHTML);
  });

  if (clusterFeatures.length > CLUSTER_ICON_DISPLAY_LENGTH) {
    const featuresCountHTML = document.createElement('p');
    featuresCountHTML.innerHTML = `+${clusterFeatures.length - CLUSTER_ICON_DISPLAY_LENGTH}`;
    injectStylesToElement(featuresCountHTML, FEATURE_COUNT_HTML_STYLES);
    clusterHTMLMarkerContainer.appendChild(featuresCountHTML);
  }

  return clusterHTMLMarkerContainer;
};

export const onClusterClick = (
  clusterCoordinates,
  clusterFeatures,
  clusterHash,
  clusterMarkerHashMapRef,
  map,
  onShowClusterSelectPopup,
  source
) => () => {
  if (!clusterMarkerHashMapRef.current[clusterHash]) return;

  const mapZoom = map.getZoom();
  if (mapZoom < CLUSTER_CLICK_ZOOM_THRESHOLD) {
    source.getClusterExpansionZoom(
      clusterMarkerHashMapRef.current[clusterHash].id,
      (error, zoom) => !error && map.easeTo({ center: clusterCoordinates, zoom })
    );
  } else {
    onShowClusterSelectPopup(clusterFeatures, clusterCoordinates);
  }
};

export const getRenderedClustersData = async (clustersSource, map) => {
  const renderedClusterIds = map.queryRenderedFeatures({ layers: [CLUSTERS_LAYER_ID] })
    .map((cluster) => cluster.properties.cluster_id);

  const getAllClusterLeavesPromises = renderedClusterIds.map((clusterId) => new Promise((resolve, reject) => {
    clustersSource.getClusterLeaves(
      clusterId,
      Number.MAX_SAFE_INTEGER,
      0,
      (error, features) => !error ? resolve(features) : reject(error)
    );
  }));
  const renderedClusterFeatures = await Promise.all(getAllClusterLeavesPromises);

  const renderedClusterHashes = renderedClusterFeatures.map(
    (clusterFeatures) => hashCode(clusterFeatures.map(clusterFeature => clusterFeature.properties.id).join(''))
  );

  return { renderedClusterFeatures, renderedClusterHashes, renderedClusterIds };
};

export const removeOldClusterMarkers = (clusterMarkerHashMapRef, removeClusterPolygon, renderedClusterHashes) => {
  const renderedClusterHashesSet = new Set(renderedClusterHashes);
  const prevClusterHashes = Object.keys(clusterMarkerHashMapRef.current).map((clusterHash) => parseInt(clusterHash));
  prevClusterHashes.forEach((prevClusterHash) => {
    if (!renderedClusterHashesSet.has(prevClusterHash)) {
      clusterMarkerHashMapRef.current[prevClusterHash].marker.remove();
      removeClusterPolygon();
    }
  });
};

export const addNewClusterMarkers = (
  clusterMarkerHashMapRef,
  clustersSource,
  map,
  removeClusterPolygon,
  renderClusterPolygon,
  renderedClusterFeatures,
  renderedClusterHashes,
  renderedClusterIds,
  onShowClusterSelectPopup
) => {
  const renderedClusterMarkersHashMap = {};

  renderedClusterFeatures.forEach((clusterFeatures, index) => {
    const clusterHash = renderedClusterHashes[index];
    const clusterId = renderedClusterIds[index];

    let marker = clusterMarkerHashMapRef.current[clusterHash]?.marker;
    if (!marker) {
      const clusterFeatureCollection = featureCollection(clusterFeatures);
      const clusterPoint = centroid(clusterFeatureCollection);
      const newClusterHTMLMarkerContainer = createClusterHTMLMarker(
        clusterFeatures,
        onClusterClick(
          clusterPoint.geometry.coordinates,
          clusterFeatures,
          clusterHash,
          clusterMarkerHashMapRef,
          map,
          onShowClusterSelectPopup,
          clustersSource
        ),
        () => renderClusterPolygon(clusterFeatureCollection),
        () => removeClusterPolygon()
      );

      marker = new mapboxgl.Marker(newClusterHTMLMarkerContainer)
        .setLngLat(clusterPoint.geometry.coordinates)
        .addTo(map);
    }

    renderedClusterMarkersHashMap[clusterHash] = { id: clusterId, marker };
  });

  return renderedClusterMarkersHashMap;
};

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
  onPointClick,
  showPopup,
  subjectFeatureCollection,
  pointFeaturesCollection,
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
    onSelectPoint: onPointClick,
  }), [onEventClick, onSubjectClick, onPointClick, showPopup]);

  const pointSymbolFeatures = pointFeaturesCollection.features.reduce(
    (pointSymbolFeatures, multiPointFeature) => [...pointSymbolFeatures, ...explode(multiPointFeature).features],
    []
  );

  useEffect(() => {
    if (map) {
      const sourceData = {
        features: [...eventFeatureCollection.features, ...subjectFeatureCollection.features, ...pointSymbolFeatures],
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

      updateClusterMarkers(
        clusterMarkerHashMapRef,
        onShowClusterSelectPopup,
        map,
        removeClusterPolygon,
        renderClusterPolygon
      );
    }
  }, [
    eventFeatureCollection.features,
    map,
    removeClusterPolygon,
    renderClusterPolygon,
    onShowClusterSelectPopup,
    pointSymbolFeatures,
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
  onPointClick: PropTypes.func.isRequired,
  showPopup: PropTypes.func.isRequired,
  subjectFeatureCollection: PropTypes.shape({
    features: PropTypes.array,
    type: PropTypes.string,
  }).isRequired,
  pointFeaturesCollection: PropTypes.shape({
    features: PropTypes.array,
    type: PropTypes.string,
  }).isRequired,
};

const mapStatetoProps = (state) => ({
  eventFeatureCollection: getMapEventFeatureCollectionWithVirtualDate(state),
  subjectFeatureCollection: getMapSubjectFeatureCollectionWithVirtualPositioning(state),
  pointFeaturesCollection: getFeatureSetFeatureCollectionsByType(state).symbolFeatures,
});

export default connect(mapStatetoProps, { showPopup })(withMap(ClustersLayer));
