import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { hashCode } from '../utils/string';
import { injectStylesToElement } from '../utils/styles';
import { LAYER_IDS } from '../constants';
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

const createClusterHTMLMarker = (clusterFeatures, showClusterSelectPopup) => {
  const clusterHTMLMarkerContainer = document.createElement('div');
  clusterHTMLMarkerContainer.onclick = () => showClusterSelectPopup(clusterFeatures, clusterFeatures[0].geometry.coordinates);
  injectStylesToElement(clusterHTMLMarkerContainer, clusterHTMLMarkerContainerStyles);

  clusterFeatures.slice(0, 3).forEach((feature) => {
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

const getClusterFeaturesMap = async (map) => {
  const clusters = map.queryRenderedFeatures({ layers: [CLUSTERS_LAYER_ID] });
  const source = map.getSource('clusters-source'); // TODO: Remove hardcoded string

  const featuresArray = await Promise.all(clusters.map((cluster) => new Promise((resolve, reject) => {
    source.getClusterLeaves(cluster.properties.cluster_id, Number.MAX_SAFE_INTEGER, 0, (error, features) => {
      if (error) {
        reject(error);
      }
      resolve(features);
    });
  })));

  return featuresArray.reduce((clusterFeaturesMap, clusterFeatures) => {
    const clusterHash = hashCode(clusterFeatures.join(''));

    return { ...clusterFeaturesMap, [clusterHash]: clusterFeatures };
  }, {});
};

const updateClusterMarkers = async (showClusterSelectPopup, map) => {
  const newClusterFeaturesMap = await getClusterFeaturesMap(map);

  const prevClusterHashes = new Set(Object.keys(CLUSTER_MARKER_MAP));
  const newClusterHashes = new Set(Object.keys(newClusterFeaturesMap));

  prevClusterHashes.forEach((prevClusterHash) => {
    if (!newClusterHashes.has(prevClusterHash)) {
      CLUSTER_MARKER_MAP[prevClusterHash].remove();
    }
  });

  const newClusterMarkerMap = {};
  newClusterHashes.forEach((newClusterHash) => {
    let marker = CLUSTER_MARKER_MAP[newClusterHash];

    if (!marker) {
      // TODO: Sort features by importance
      const newClusterHTMLMarkerContainer = createClusterHTMLMarker(
        newClusterFeaturesMap[newClusterHash],
        showClusterSelectPopup,
      );

      marker = new mapboxgl.Marker(newClusterHTMLMarkerContainer)
        .setLngLat(newClusterFeaturesMap[newClusterHash][0].geometry.coordinates)
        .addTo(map);
    }

    newClusterMarkerMap[newClusterHash] = marker;
  });

  CLUSTER_MARKER_MAP = newClusterMarkerMap;
};

export default (map, onEventClick, onSubjectClick) => {
  // TODO: clusters are not being rendered until I move the map
  const dispatch = useDispatch();
  const showClusterSelectPopup = useCallback((layers, coordinates) => dispatch(showPopup('cluster-select', {
    layers,
    coordinates,
    onSelectSubject: onSubjectClick,
    onSelectEvent: onEventClick,
  })), [dispatch, onEventClick, onSubjectClick]);

  useEffect(() => {
    const onMapMoveEnd = () => updateClusterMarkers(showClusterSelectPopup, map);
    map.on('moveend', onMapMoveEnd);

    return () => map.off('moveend', onMapMoveEnd);
  }, [map, showClusterSelectPopup]);
};
