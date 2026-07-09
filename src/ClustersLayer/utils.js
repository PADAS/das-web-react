import { centroid, featureCollection } from '@turf/turf';
import mapboxgl from 'mapbox-gl';

import { calcGenericFallbackImageUrl, calcSpriteSvgUrl } from '../utils/img';
import { CLUSTER_CLICK_ZOOM_THRESHOLD, LAYER_IDS, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { calcSvgImageIconId } from '../utils/mapImages';
import { ensureEventIcon, getEventIcon } from '../utils/eventMapIcons';
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

// When the feature is the event being edited locally, reflect its unsaved
// priority so the icon variant matches the edit in progress.
const eventIconParamsFor = (feature, locallyEditedEvent) => {
  const priority = locallyEditedEvent?.id === feature.properties.id
    ? locallyEditedEvent.priority
    : feature.properties.priority;
  return { ...feature.properties, priority };
};

const getFeatureIcon = (feature, locallyEditedEvent) =>
  getEventIcon(calcSvgImageIconId(eventIconParamsFor(feature, locallyEditedEvent)));

// Kicks off generation of an event feature's icon so DOM markers trigger their
// own registry lookups. Subjects have no icon_id and use the fallback img path.
const ensureFeatureIcon = (feature, locallyEditedEvent) => {
  if (feature.properties.icon_id) {
    ensureEventIcon(eventIconParamsFor(feature, locallyEditedEvent));
  }
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

const populateClusterIconChildren = (
  clusterHTMLMarkerContainer,
  clusterIconFeatures,
  totalFeatureCount,
  locallyEditedEvent = null
) => {
  while (clusterHTMLMarkerContainer.firstChild) {
    clusterHTMLMarkerContainer.removeChild(clusterHTMLMarkerContainer.firstChild);
  }

  clusterIconFeatures.forEach((feature) => {
    let featureImageHTML = getFeatureIcon(feature, locallyEditedEvent)?.cloneNode(true);
    if (!featureImageHTML) {
      featureImageHTML = document.createElement('img');
      // Tile image/image_url is unreliable: try the sprite master, then the generic per-color icon.
      if (feature.properties.icon_id) {
        featureImageHTML.src = calcSpriteSvgUrl(feature.properties.icon_id);
        featureImageHTML.onerror = () => {
          featureImageHTML.onerror = null;
          featureImageHTML.src = calcGenericFallbackImageUrl(feature.properties);
        };
      } else {
        featureImageHTML.src = feature.properties.image || feature.properties.image_url;
      }
    }
    injectStylesToElement(featureImageHTML, FEATURE_ICON_HTML_STYLES);
    if (subjectIsStatic(feature)) {
      injectStylesToElement(featureImageHTML, FEATURE_SS_ICON_HTML_STYLES);
    }
    clusterHTMLMarkerContainer.appendChild(featureImageHTML);
  });

  if (totalFeatureCount > CLUSTER_ICON_DISPLAY_LENGTH) {
    const featuresCountHTML = document.createElement('p');
    featuresCountHTML.innerHTML = `+${totalFeatureCount - CLUSTER_ICON_DISPLAY_LENGTH}`;
    injectStylesToElement(featuresCountHTML, FEATURE_COUNT_HTML_STYLES);
    clusterHTMLMarkerContainer.appendChild(featuresCountHTML);
  }
};

export const createClusterHTMLMarker = (
  clusterFeatures,
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

  populateClusterIconChildren(
    clusterHTMLMarkerContainer,
    getClusterIconFeatures(clusterFeatures),
    clusterFeatures.length,
    locallyEditedEvent
  );

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

export const getRenderedClustersData = async (clustersSource, map, locallyEditedEvent = null) => {
  const clusterIds = map.queryRenderedFeatures({ layers: [CLUSTERS_LAYER_ID] })
    .map((cluster) => cluster.properties.cluster_id);

  // Resolve empty on error so one failing cluster doesn't hang Promise.all forever.
  const getAllClusterLeavesPromises = clusterIds.map((clusterId) => new Promise((resolve) => {
    clustersSource.getClusterLeaves(
      clusterId,
      Number.MAX_SAFE_INTEGER,
      0,
      (error, features) => resolve(error ? [] : features)
    );
  }));
  const clusterFeatures = await Promise.all(getAllClusterLeavesPromises);

  // Drop empty clusters — centroid(featureCollection([])) would throw downstream. Keep the
  // three parallel arrays index-aligned by filtering ids and features together.
  const renderedClusterIds = [];
  const renderedClusterFeatures = [];
  clusterIds.forEach((clusterId, index) => {
    if (!clusterFeatures[index]?.length) return;
    renderedClusterIds.push(clusterId);
    renderedClusterFeatures.push(clusterFeatures[index]);
  });

  const renderedClusterHashes = renderedClusterFeatures.map(
    (features) => hashCode(features.map((clusterFeature) => {
      // For the locally-edited event, key the hash off its unsaved priority so the marker recreates.
      const isLocallyEdited = locallyEditedEvent?.id === clusterFeature.properties.id;
      const suffix = isLocallyEdited
        ? `local-${locallyEditedEvent.priority ?? 0}`
        : `${clusterFeature.properties.updated_at}`;
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
      clusterMarkerHashMapRef.current[prevClusterHash].marker?.remove();
      removeClusterPolygon();
    }
  });
};

export const addNewClusterMarkers = (
  addClusterPolygon,
  clusterMarkerHashMapRef,
  sourceId,
  map,
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

    const cachedEntry = clusterMarkerHashMapRef.current[clusterHash] || renderedClusterMarkersHashMap[clusterHash];
    let marker = cachedEntry?.marker;
    const wasReady = cachedEntry?.iconsReady;

    const clusterIconFeatures = wasReady ? null : getClusterIconFeatures(clusterFeatures);

    // Trigger icon generation for the features this marker will display; the
    // registry notifies once they resolve, prompting another update pass.
    clusterIconFeatures?.forEach((feature) => ensureFeatureIcon(feature, locallyEditedEvent));

    const iconsReady = wasReady || clusterIconFeatures
      .every((feature) => !feature.properties.icon_id || !!getFeatureIcon(feature, locallyEditedEvent));

    // Wait for every displayed icon to resolve before creating the marker.
    if (!marker && iconsReady) {
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

      const newClusterHTMLMarkerContainer = createClusterHTMLMarker(
        clusterFeatures,
        onClick,
        onMouseOver,
        onMouseLeave,
        locallyEditedEvent,
      );

      marker = new mapboxgl.Marker(newClusterHTMLMarkerContainer)
        .setLngLat(clusterPoint.geometry.coordinates)
        .addTo(map);
    } else if (!wasReady && iconsReady) {
      populateClusterIconChildren(
        marker.getElement(),
        clusterIconFeatures,
        clusterFeatures.length,
        locallyEditedEvent
      );
    }

    renderedClusterMarkersHashMap[clusterHash] = { iconsReady, id: clusterId, marker };
  });

  return renderedClusterMarkersHashMap;
};
