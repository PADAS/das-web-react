import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { CLUSTER_ZOOM_THRESHOLD, LAYER_IDS } from '../constants';
import { hashCode } from '../utils/string';
import { injectStylesToElement } from '../utils/styles';
import { showPopup } from '../ducks/popup';

const { CLUSTERS_LAYER_ID } = LAYER_IDS;

let CLUSTER_MARKER_MAP = {};

const clusterHTMLMarkerContainerStyles = {
  display: 'flex',
  flexDirection: 'row',
  aligntItems: 'center',
  borderRadius: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  padding: '4px 10px',
};
const featureImageHTMLStyles = {
  width: '14px',
  height: '20px',
};
const featuresCountHTMLStyles = {
  fontSize: '14px',
  fontWeight: '500',
  paddingLeft: '4px',
  margin: '0',
};

const getClusterIcons = (clusterFeatures) => {
  const eventFeatures = [];
  const subjectFeatures = [];
  const symbolFeatures = [];
  clusterFeatures.forEach((feature) => {
    if (feature.properties?.content_type === 'observations.subject') {
      subjectFeatures.push(feature);
    } else if (feature.properties?.event_type) {
      eventFeatures.push(feature);
    } else {
      symbolFeatures.push(feature);
    }
  });

  eventFeatures.sort((firstFeature, secondFeature) => {
    if (firstFeature.properties.priority < secondFeature.properties.priority) {
      return 1;
    }
    if (firstFeature.properties.priority > secondFeature.properties.priority) {
      return -1;
    }
    return firstFeature.properties.updated_at > secondFeature.properties.updated_at ? 1 : -1;
  });

  subjectFeatures.sort((firstFeature, secondFeature) => {
    const firstFeatureLastUpdate = firstFeature.properties.last_position_date > firstFeature.properties.radio_state_at
      ? firstFeature.properties.last_position_date
      : firstFeature.properties.radio_state_at;
    const secondFeatureLastUpdate = secondFeature.properties.last_position_date > secondFeature.properties.radio_state_at
      ? secondFeature.properties.last_position_date
      : secondFeature.properties.radio_state_at;

    return firstFeatureLastUpdate < secondFeatureLastUpdate ? 1 : -1;
  });

  const clusterIcons = [];
  let featureIndex = 0;
  const iconsLength = Math.min(clusterFeatures.length, 3);
  while (clusterIcons.length < iconsLength) {
    if (!!subjectFeatures?.[featureIndex]) {
      clusterIcons.push(subjectFeatures[featureIndex]);
    }
    if (!!eventFeatures?.[featureIndex]) {
      clusterIcons.push(eventFeatures[featureIndex]);
    }
    if (!!symbolFeatures?.[featureIndex]) {
      clusterIcons.push(symbolFeatures[featureIndex]);
    }
    featureIndex++;
  }

  return clusterIcons.slice(0, 3);
};

const createClusterHTMLMarker = (clusterFeatures, onClusterClick) => {
  const clusterHTMLMarkerContainer = document.createElement('div');
  clusterHTMLMarkerContainer.onclick = onClusterClick;
  injectStylesToElement(clusterHTMLMarkerContainer, clusterHTMLMarkerContainerStyles);

  const clusterIcons = getClusterIcons(clusterFeatures);

  clusterIcons.forEach((feature) => {
    const featureImageHTML = document.createElement('img');
    featureImageHTML.src = feature.properties.image;
    injectStylesToElement(featureImageHTML, featureImageHTMLStyles);
    clusterHTMLMarkerContainer.appendChild(featureImageHTML);
  });

  if (clusterFeatures.length > 3) {
    const featuresCountHTML = document.createElement('p');
    featuresCountHTML.innerHTML = `+${clusterFeatures.length - 3}`;
    injectStylesToElement(featuresCountHTML, featuresCountHTMLStyles);
    clusterHTMLMarkerContainer.appendChild(featuresCountHTML);
  }

  return clusterHTMLMarkerContainer;
};

const onClusterClick = (
  clusterCoordinates,
  clusterFeatures,
  clusterHash,
  map,
  showClusterSelectPopup,
  source
) => () => {
  if (!CLUSTER_MARKER_MAP[clusterHash]) return;

  const mapZoom = map.getZoom();
  if (mapZoom < CLUSTER_ZOOM_THRESHOLD) {
    source.getClusterExpansionZoom(
      CLUSTER_MARKER_MAP[clusterHash].id,
      (error, zoom) => !error && map.easeTo({ center: clusterCoordinates, zoom })
    );
  } else {
    showClusterSelectPopup(clusterFeatures, clusterCoordinates);
  }
};

const getRenderedClustersData = async (clustersSource, map) => {
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

const removeOldClusterMarkers = (renderedClusterHashes) => {
  const renderedClusterHashesSet = new Set(renderedClusterHashes);
  const prevClusterHashes = Object.keys(CLUSTER_MARKER_MAP).map((clusterHash) => parseInt(clusterHash));
  prevClusterHashes.forEach((prevClusterHash) => {
    if (!renderedClusterHashesSet.has(prevClusterHash)) {
      CLUSTER_MARKER_MAP[prevClusterHash].marker.remove();
    }
  });
};

const addNewClusterMarkers = (
  clustersSource,
  map,
  renderedClusterFeatures,
  renderedClusterHashes,
  renderedClusterIds,
  showClusterSelectPopup
) => {
  const renderedClusterMarkersHashMap = {};

  renderedClusterFeatures.forEach((clusterFeatures, index) => {
    const clusterHash = renderedClusterHashes[index];
    const clusterId = renderedClusterIds[index];

    let marker = CLUSTER_MARKER_MAP[clusterHash]?.marker;
    if (!marker) {
      const clusterCoordinates = clusterFeatures[0].geometry.coordinates;
      const newClusterHTMLMarkerContainer = createClusterHTMLMarker(
        clusterFeatures,
        onClusterClick(clusterCoordinates, clusterFeatures, clusterHash, map, showClusterSelectPopup, clustersSource),
      );

      marker = new mapboxgl.Marker(newClusterHTMLMarkerContainer)
        .setLngLat(clusterCoordinates)
        .addTo(map);
    }

    renderedClusterMarkersHashMap[clusterHash] = { id: clusterId, marker };
  });

  return renderedClusterMarkersHashMap;
};

const updateClusterMarkers = async (showClusterSelectPopup, map) => {
  const clustersSource = map.getSource('clusters-source'); // TODO: Remove hardcoded string
  const {
    renderedClusterFeatures,
    renderedClusterHashes,
    renderedClusterIds,
  } = await getRenderedClustersData(clustersSource, map);

  removeOldClusterMarkers(renderedClusterHashes);

  CLUSTER_MARKER_MAP = addNewClusterMarkers(
    clustersSource,
    map,
    renderedClusterFeatures,
    renderedClusterHashes,
    renderedClusterIds,
    showClusterSelectPopup
  );
};

export default (map, onEventClick, onSubjectClick, onSymbolClick) => {
  // TODO: clusters are not being rendered until I move the map
  const dispatch = useDispatch();
  const showClusterSelectPopup = useCallback((layers, coordinates) => dispatch(showPopup('cluster-select', {
    layers,
    coordinates,
    onSelectEvent: onEventClick,
    onSelectSubject: onSubjectClick,
    onSelectSymbol: onSymbolClick,
  })), [dispatch, onEventClick, onSubjectClick, onSymbolClick]);

  useEffect(() => {
    const onMapMoveEnd = () => updateClusterMarkers(showClusterSelectPopup, map);
    map.on('moveend', onMapMoveEnd);

    return () => map.off('moveend', onMapMoveEnd);
  }, [map, showClusterSelectPopup]);
};
