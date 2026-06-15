import { centroid, featureCollection } from '@turf/turf';
import mapboxgl from 'mapbox-gl';

import { CLUSTER_CLICK_ZOOM_THRESHOLD, LAYER_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { calcSvgImageIconId } from '../utils/mapImages';
import { subjectIsStatic } from '../utils/subjects';
import { injectStylesToElement } from '../utils/styles';
import { hashCode } from '../utils/string';

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

const getFeatureIcon = (feature, mapImages, locallyEditedEvent) => {
  const priority = locallyEditedEvent?.id === feature.properties.id
    ? locallyEditedEvent.priority
    : feature.properties.priority;
  return mapImages[calcSvgImageIconId({ icon_id: feature.properties.icon_id, priority })]?.image;
};

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
    if (subjectFeatures?.[featureIndex]) clusterIconFeatures.push(subjectFeatures[featureIndex]);
    if (eventFeatures?.[featureIndex]) clusterIconFeatures.push(eventFeatures[featureIndex]);
    featureIndex++;
  }

  return clusterIconFeatures.slice(0, CLUSTER_ICON_DISPLAY_LENGTH);
};

export const createClusterHTMLMarker = (
  clusterFeatures,
  mapImages,
  onClusterClick,
  onMouseOverCluster,
  onMouseLeaveCluster,
  locallyEditedEvent = null
) => {
  const clusterHTMLMarkerContainer = document.createElement('div');
  clusterHTMLMarkerContainer.onclick = onClusterClick;
  clusterHTMLMarkerContainer.onmouseover = onMouseOverCluster;
  clusterHTMLMarkerContainer.onmouseleave = onMouseLeaveCluster;
  injectStylesToElement(clusterHTMLMarkerContainer, CLUSTER_HTML_MARKER_CONTAINER_STYLES);

  getClusterIconFeatures(clusterFeatures).forEach((feature) => {
    let featureImageHTML = getFeatureIcon(feature, mapImages, locallyEditedEvent)?.cloneNode(true);
    if (!featureImageHTML) {
      featureImageHTML = document.createElement('img');
      featureImageHTML.src = feature.properties.image || feature.properties.image_url;
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
  sourceId
) => (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (!clusterMarkerHashMapRef.current[clusterHash]) return;

  const mapZoom = map.getZoom();
  if (mapZoom < CLUSTER_CLICK_ZOOM_THRESHOLD) {
    map.getSource(sourceId).getClusterExpansionZoom(
      clusterMarkerHashMapRef.current[clusterHash].id,
      (error, zoom) => !error && map.easeTo({ center: clusterCoordinates, zoom: zoom + 0.1 })
    );
  } else {
    onShowClusterSelectPopup(clusterFeatures, clusterCoordinates);
  }
};

export const getRenderedClustersData = async (clustersSource, map, locallyEditedEvent = null, mapImages = null) => {
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
    (clusterFeatures) => hashCode(clusterFeatures.map((clusterFeature) => {
      const isLocallyEdited = locallyEditedEvent?.id === clusterFeature.properties.id;
      const priority = clusterFeature.properties.priority ?? 0;
      // Include whether the icon image is loaded so the hash changes when mapImages gains the entry,
      // forcing the marker to be recreated with the correct icon.
      const iconKey = calcSvgImageIconId({
        icon_id: clusterFeature.properties.icon_id,
        priority: clusterFeature.properties.priority,
      });
      // For a locally-edited feature, imageLoaded is computed from the feature's ORIGINAL
      // priority icon key (not the locally-edited priority). That is intentional and harmless
      // because addNewClusterMarkers unconditionally recreates any marker containing the
      // locally-edited feature, so its icon is always refreshed regardless of this bit.
      const imageLoaded = mapImages?.[iconKey] ? '1' : '0';
      const suffix = isLocallyEdited
        ? `local-${locallyEditedEvent.priority ?? 0}`
        : `${clusterFeature.properties.updated_at}-${priority}-${imageLoaded}`;
      return `${clusterFeature.properties.id} ${suffix}`;
    }).join(''))
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
  addClusterPolygon,
  clusterMarkerHashMapRef,
  sourceId,
  map,
  mapImages,
  removeClusterPolygon,
  renderedClusterFeatures,
  renderedClusterHashes,
  renderedClusterIds,
  onShowClusterSelectPopup,
  locallyEditedEvent = null
) => {
  const renderedClusterMarkersHashMap = {};

  renderedClusterFeatures.forEach((clusterFeatures, index) => {
    const clusterHash = renderedClusterHashes[index];
    const clusterId = renderedClusterIds[index];

    // If the cluster contains the locally-edited event, always recreate the marker
    // so it reflects the latest mapImages (which may now have the new-priority image).
    const hasLocallyEditedFeature = locallyEditedEvent
      && clusterFeatures.some((f) => f.properties.id === locallyEditedEvent.id);

    let marker = !hasLocallyEditedFeature && (
      clusterMarkerHashMapRef.current[clusterHash]?.marker
      || renderedClusterMarkersHashMap[clusterHash]?.marker
    );

    if (!marker) {
      if (hasLocallyEditedFeature) {
        clusterMarkerHashMapRef.current[clusterHash]?.marker?.remove();
      }

      const clusterFeatureCollection = featureCollection(clusterFeatures);
      const clusterPoint = centroid(clusterFeatureCollection);
      const onClick = onClusterClick(
        clusterPoint.geometry.coordinates,
        clusterFeatures,
        clusterHash,
        clusterMarkerHashMapRef,
        map,
        onShowClusterSelectPopup,
        sourceId
      );
      const onMouseOver = () => addClusterPolygon(clusterFeatureCollection);
      const onMouseLeave = () => removeClusterPolygon();

      let newClusterHTMLMarkerContainer = createClusterHTMLMarker(
        clusterFeatures,
        mapImages,
        onClick,
        onMouseOver,
        onMouseLeave,
        locallyEditedEvent,
      );

      marker = new mapboxgl.Marker(newClusterHTMLMarkerContainer)
        .setLngLat(clusterPoint.geometry.coordinates)
        .addTo(map);
    }

    renderedClusterMarkersHashMap[clusterHash] = { id: clusterId, marker };
  });

  return renderedClusterMarkersHashMap;
};

