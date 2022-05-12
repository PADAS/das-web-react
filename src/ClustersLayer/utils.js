import centroid from '@turf/centroid';
import { featureCollection } from '@turf/helpers';
import mapboxgl from 'mapbox-gl';

import { CLUSTER_CLICK_ZOOM_THRESHOLD, LAYER_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { hashCode } from '../utils/string';
import { subjectIsStatic } from '../utils/subjects';
import { injectStylesToElement } from '../utils/styles';

const { CLUSTERS_LAYER_ID } = LAYER_IDS;

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
const FEATURE_ICON_HTML_STYLES = { maxWidth: '24px', minWidth: '18px', height: '24px', margin: '0 1px' };
const FEATURE_SS_ICON_HTML_STYLES = { filter: 'brightness(0)' };
const FEATURE_COUNT_HTML_STYLES = { fontSize: '16px', fontWeight: '500', paddingLeft: '4px', margin: '0' };

const getFeatureIcon = (feature, mapImages) =>
  mapImages[`${feature.properties.icon_id}-${feature.properties.priority}`]?.image;

export const getClusterIconFeatures = (clusterFeatures) => {
  const { eventFeatures, subjectFeatures } = clusterFeatures.reduce((accumulator, feature) => {
    if (feature.properties?.content_type === SUBJECT_FEATURE_CONTENT_TYPE) {
      return { ...accumulator, subjectFeatures: [...accumulator.subjectFeatures, feature] };
    }
    return { ...accumulator, eventFeatures: [...accumulator.eventFeatures, feature] };
  }, { eventFeatures: [], subjectFeatures: [] });

  eventFeatures.sort((firstFeature, secondFeature) => {
    if (firstFeature.properties.priority > secondFeature.properties.priority) return -1;
    if (firstFeature.properties.priority < secondFeature.properties.priority) return 1;
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
    featureIndex++;
  }

  return clusterIconFeatures.slice(0, CLUSTER_ICON_DISPLAY_LENGTH);
};

export const createClusterHTMLMarker = (
  clusterFeatures,
  mapImages,
  onClusterClick,
  onMouseOverCluster,
  onMouseLeaveCluster
) => {
  const clusterHTMLMarkerContainer = document.createElement('div');
  clusterHTMLMarkerContainer.onclick = onClusterClick;
  clusterHTMLMarkerContainer.onmouseover = onMouseOverCluster;
  clusterHTMLMarkerContainer.onmouseleave = onMouseLeaveCluster;
  injectStylesToElement(clusterHTMLMarkerContainer, CLUSTER_HTML_MARKER_CONTAINER_STYLES);

  getClusterIconFeatures(clusterFeatures).forEach((feature) => {
    let featureImageHTML = getFeatureIcon(feature, mapImages);
    if (!featureImageHTML) {
      featureImageHTML = document.createElement('img');
      featureImageHTML.src = feature.properties.image;
    }
    injectStylesToElement(featureImageHTML, FEATURE_ICON_HTML_STYLES);
    if (subjectIsStatic(feature)) {
      injectStylesToElement(featureImageHTML, FEATURE_SS_ICON_HTML_STYLES);
    }
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
      (error, zoom) => !error && map.easeTo({ center: clusterCoordinates, zoom: zoom + 0.1 })
    );
  } else {
    onShowClusterSelectPopup(clusterFeatures, clusterCoordinates);
  }
};

export const getRenderedClustersData = async (clustersSource, map) => {
  const renderedClusterIds = map.queryRenderedFeatures({ layers: [CLUSTERS_LAYER_ID] })
    .map((cluster) => cluster.properties.cluster_id);

  const getAllClusterLeavesPromises = renderedClusterIds.map((clusterId) => new Promise((resolve) => {
    clustersSource.getClusterLeaves(
      clusterId,
      Number.MAX_SAFE_INTEGER,
      0,
      (error, features) => !error && resolve(features)
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
  mapImages,
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

    let marker = clusterMarkerHashMapRef.current[clusterHash]?.marker
      || renderedClusterMarkersHashMap[clusterHash]?.marker;
    if (!marker) {
      const clusterFeatureCollection = featureCollection(clusterFeatures);
      const clusterPoint = centroid(clusterFeatureCollection);
      let newClusterHTMLMarkerContainer = createClusterHTMLMarker(
        clusterFeatures,
        mapImages,
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

      newClusterHTMLMarkerContainer = null; // forcing garbage collection
    }

    renderedClusterMarkersHashMap[clusterHash] = { id: clusterId, marker };
  });

  return renderedClusterMarkersHashMap;
};

export const updateClusterMarkers = async (
  clusterMarkerHashMapRef,
  onShowClusterSelectPopup,
  map,
  mapImages,
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
    mapImages,
    removeClusterPolygon,
    renderClusterPolygon,
    renderedClusterFeatures,
    renderedClusterHashes,
    renderedClusterIds,
    onShowClusterSelectPopup
  );
};
