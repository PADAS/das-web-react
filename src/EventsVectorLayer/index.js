import React, { useContext, useEffect, useState, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { MapContext } from '../App';
import { displayTitleForEvent } from '../utils/events';
import { PRIORITY_COLOR_MAP } from '../utils/events'; // <-- import the color map
import throttle from 'lodash/throttle';

const SOURCE_ID = 'event-vector-source';
const LAYER_ID = 'event-vector-layer';

const LABEL_LAYER_ID = `${LAYER_ID}-label`;
const LABEL_SOURCE_ID = 'event-labels-geojson';

// New constants for the clustering feature
const CLUSTER_SOURCE_ID = 'event-cluster-source';
const CLUSTER_LAYER_ID = 'event-cluster-layer';
const CLUSTER_COUNT_LAYER_ID = 'event-cluster-count-layer';

const defaultEventStates = ['active', 'new'];

const API_HOST = process.env.NODE_ENV === 'production'
  ? window.location.origin
  : process.env.REACT_APP_DAS_HOST;

const EventsVectorLayer = (props) => {
  const { onEventClick } = props;
  const map = useContext(MapContext);
  // Disable for production or make configurable
  map.showTileBoundaries = true;

  const eventTypes = useSelector(state => state.data.eventTypes);
  const eventFilter = useSelector(state => state.data.eventFilter);
  const token = useSelector((state) => state.data.token?.access_token);

  const [extractedFeatures, setExtractedFeatures] = useState({ type: 'FeatureCollection', features: [] });

  // Add at the top with other state variables
  const [clusteredFeatureIds, setClusteredFeatureIds] = useState(new Set());

  // Add zoom threshold constant - clusters shown below this zoom level
  const CLUSTER_ZOOM_THRESHOLD = 3;

  // Store previous zoom to avoid unnecessary updates
  const prevZoomRef = useRef(null);

  useEffect(() => {
    // Dynamically load missing images when requested by the style
    if (!map) return;

    const handleStyleImageMissing = (e) => {
      const imageId = e.id;
      if (!map.hasImage(imageId)) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Draw the image to a 40x40 canvas (2x for HiDPI), then use icon-size 0.5
          const baseDim = 20;
          const maxDim = baseDim * 2; // 40px
          let { width, height } = img;
          if (width === 0 || height === 0) {
            width = maxDim;
            height = maxDim;
          }
          const scale = Math.min(maxDim / width, maxDim / height, 1);
          const drawWidth = Math.round(width * scale);
          const drawHeight = Math.round(height * scale);

          // Always create a 40x40 canvas and center the icon
          const canvas = document.createElement('canvas');
          canvas.width = maxDim;
          canvas.height = maxDim;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, maxDim, maxDim);
          const dx = Math.floor((maxDim - drawWidth) / 2);
          const dy = Math.floor((maxDim - drawHeight) / 2);
          ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

          // Convert canvas to ImageData for Mapbox
          const imageData = ctx.getImageData(0, 0, maxDim, maxDim);

          if (!map.hasImage(imageId)) {
            map.addImage(imageId, imageData, { pixelRatio: 2 });
          }
        };
        img.onerror = () => {
          console.log('img.src', img.src);
          console.warn(`Could not load image: ${imageId}`);
        };
        img.src = imageId;
      }
    };
    map.on('styleimagemissing', handleStyleImageMissing);
    return () => map.off('styleimagemissing', handleStyleImageMissing);
  }, [map]);

  // Refactor buildTileUrl to useMemo since it returns a string
  const tileUrl = useMemo(() => {
    const { filter: { date_range, priority, reported_by }, state: eventStates } = eventFilter || {};
    const statesToSend = eventStates?.length ? eventStates : defaultEventStates;
    const lower = date_range?.lower ?? '';
    const upper = date_range?.upper ?? null;

    // Generate multiple "state=" parameters
    const stateParams = statesToSend.map(
      state => `state=${encodeURIComponent(state)}`
    );

    let dateParams = encodeURIComponent(lower);
    if (upper) {
      dateParams += `,${encodeURIComponent(upper)}`;
    }

    const params = [
      ...stateParams,
      `api_host=${API_HOST}`,
      `api_token=${token}`,
      dateParams,
    ];

    if (reported_by?.length) {
      params.push(`reported_by=${encodeURIComponent(reported_by)}`);
    }

    if (priority?.length) {
      params.push(`priority=${encodeURIComponent(priority)}`);
    }

    const prodUrl = 'https://vector-tile-server-cm4yoasyba-uc.a.run.app';
    const localUrl = 'http://localhost:3000';

    return `${localUrl}/tiles/{z}/{x}/{y}.mvt?${params.join('&')}`;
  }, [eventFilter, token]);

  useEffect(() => {
    if (!map) return;
    let source = map.getSource(SOURCE_ID);

    const updateTiles = () => {
      source.tiles = [tileUrl];
      source.setTiles([tileUrl]);
      source.load();
    };

    if (!source) {
      map.addSource(SOURCE_ID, {
        type: 'vector',
        tiles: [tileUrl],
        minzoom: 1,
        maxzoom: 20
      });
    } else {
      if (source.tiles[0] !== tileUrl) {
        updateTiles();
      }
    }
  }, [map, tileUrl]);

  // --- Cross-fade tile source URLs to avoid visual flash ---
  useEffect(() => {
    if (!map) return;

    let source = map.getSource(SOURCE_ID);

    // Always update the tileUrl if any dependency changes
    if (!source) {
      map.addSource(SOURCE_ID, {
        type: 'vector',
        tiles: [tileUrl],
        minzoom: 1,
        maxzoom: 20
      });
    }
  }, [map, tileUrl, eventFilter]);

  useEffect(() => {
    if (!map) return;

    // Helper: get color for a priority value
    const getPriorityColor = (priority, fallback = '#888888') => {
      const entry = PRIORITY_COLOR_MAP[priority];
      return entry?.base || fallback;
    };

    // Build color expressions using PRIORITY_COLOR_MAP
    const priorityColorExpression = [
      'case',
      ['has', 'priority'],
      [
        'match',
        ['get', 'priority'],
        0, getPriorityColor(0),
        100, getPriorityColor(100),
        200, getPriorityColor(200),
        300, getPriorityColor(300),
        /* other */ '#888888'
      ],
      '#888888'
    ];

    const layersToAdd = [
      {
        id: `${LAYER_ID}-polygon`,
        type: 'fill',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': priorityColorExpression,
          'fill-opacity': 0.4,
          'fill-outline-color': '#fff',
          'fill-antialias': true
        }
      },
      {
        id: `${LAYER_ID}-circle`,
        type: 'circle',
        before: LAYER_ID,
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 22,
          'circle-translate': [0, -38],
          'circle-translate-anchor': 'viewport',
          'circle-color': priorityColorExpression,
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2,
        }
      },
      {
        id: LAYER_ID,
        type: 'symbol',
        filter: ['==', '$type', 'Point'],
        layout: {
          'icon-image': ['get', 'image_url'],
          'icon-size': 1,
          'icon-anchor': 'center',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'symbol-avoid-edges': false,
          'icon-rotation-alignment': 'viewport',
          'icon-pitch-alignment': 'viewport',
          'icon-offset': [0, -37],
        },
        paint: {
          // 'icon-translate': [0, -40],
          'icon-translate-anchor': 'viewport',
          'icon-color': priorityColorExpression
        }
      },
      {
        id: `${LAYER_ID}-pointer`,
        type: 'symbol',
        filter: ['==', '$type', 'Point'],
        layout: {
          'text-field': '▼',
          'text-anchor': 'bottom',
          'text-size': 44,
          'text-font': ['Arial Unicode MS Bold', 'Open Sans Semibold'],
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'symbol-avoid-edges': false,
        },
        paint: {
          'text-translate': [0, 12],
          'text-translate-anchor': 'viewport',
          'text-color': priorityColorExpression
        }
      },
      // --- Add this layer at the end for highest stacking order ---
      {
        id: `${LAYER_ID}-dot`,
        type: 'circle',
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 3,
          'circle-color': priorityColorExpression,
          'circle-stroke-color': '#fff', // purple
          'circle-stroke-width': 2
        }
      }
    ];

    layersToAdd.forEach(layer => {
      if (!map.getLayer(layer.id)) {
        map.addLayer({ ...layer, source: SOURCE_ID, 'source-layer': 'events' });
      }
    });
  }, [map, eventTypes]);

  useEffect(() => {
    if (!map) return;

    const layerId = `${LAYER_ID}-circle`;

    const updateCircleVisibility = () => {
      const pitch = map.getPitch();
      if (map.getLayer(layerId)) {
        map.setPaintProperty(
          layerId,
          'circle-opacity',
          pitch > 40 ? 0 : 1
        );
        map.setPaintProperty(
          layerId,
          'circle-stroke-opacity',
          pitch > 40 ? 0 : 1
        );
      }
    };

    map.on('pitch', updateCircleVisibility);
    // Initial check
    updateCircleVisibility();

    return () => {
      map.off('pitch', updateCircleVisibility);
    };
  }, [map]);

  // Modify the existing sourcedata handler to also extract features for clustering
  useEffect(() => {
    if (!map) return;

    // Only handle sourcedata events for our vector source, and throttle to once per second
    const THROTTLE_MS = 1000;

    const processSourceFeatures = throttle(() => {
      const features = map.querySourceFeatures?.(SOURCE_ID, { sourceLayer: 'events' }) || [];

      // Create features for labels
      const labelFeatures = [];
      // Create features for clustering (only points)
      const clusterFeatures = [];

      console.log(`Processing ${features.length} source features`);

      // Process each feature
      features.forEach(feature => {
        if (!feature.id || !feature.geometry) return;

        const display_title = displayTitleForEvent(feature.properties, eventTypes);

        // Format the time if available
        let date_formatted = '';
        if (feature.properties.time) {
          try {
            const date = new Date(feature.properties.time);
            date_formatted = date.toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            });
          } catch (e) {
            console.warn('Error formatting date for event', feature.id);
          }
        }

        // Add to label features with formatted date
        labelFeatures.push({
          type: 'Feature',
          geometry: feature.geometry,
          properties: {
            id: feature.id,
            display_title,
            date_formatted
          }
        });

        // Add to cluster features (only point features)
        if (feature.geometry.type === 'Point') {
          clusterFeatures.push({
            type: 'Feature',
            geometry: feature.geometry,
            properties: {
              ...feature.properties, // Keep original properties
              id: feature.id,
              display_title,
              date_formatted,
              // Add any additional properties needed for clustering
              priority_level: feature.properties.priority || 0
            }
          });
        }
      });

      // Update label source
      const labelSource = map.getSource(LABEL_SOURCE_ID);
      const labelData = { type: 'FeatureCollection', features: labelFeatures };

      if (labelSource) {
        labelSource.setData(labelData);
      } else {
        map.addSource(LABEL_SOURCE_ID, {
          type: 'geojson',
          data: labelData
        });
      }

      // Update cluster source
      const clusterData = {
        type: 'FeatureCollection',
        features: clusterFeatures
      };
      setExtractedFeatures(clusterData);

      const clusterSource = map.getSource(CLUSTER_SOURCE_ID);
      if (clusterSource) {
        clusterSource.setData(clusterData);
      } else if (clusterFeatures.length > 0) {
        // Only create the source if we have features
        map.addSource(CLUSTER_SOURCE_ID, {
          type: 'geojson',
          data: clusterData,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50
        });

        // Setup clustering layers if they don't exist yet
        setupClusteringLayers();
      }
    }, THROTTLE_MS, { leading: true, trailing: true });

    const setupClusteringLayers = () => {
      if (!map.getSource(CLUSTER_SOURCE_ID)) return;

      // Add a layer for the clusters
      if (!map.getLayer(CLUSTER_LAYER_ID)) {
        map.addLayer({
          id: CLUSTER_LAYER_ID,
          type: 'circle',
          source: CLUSTER_SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#51bbd6',
              10, '#f1f075',
              30, '#f28cb1'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              10, 30,
              30, 40
            ]
          }
        });
      }

      // Add a layer for the cluster count labels
      if (!map.getLayer(CLUSTER_COUNT_LAYER_ID)) {
        map.addLayer({
          id: CLUSTER_COUNT_LAYER_ID,
          type: 'symbol',
          source: CLUSTER_SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
          },
          paint: {
            'text-color': '#ffffff'
          }
        });
      }
    };

    const handleSourceData = (e) => {
      if (e?.sourceId === SOURCE_ID || e?.source?.id === SOURCE_ID) {
        processSourceFeatures();
      }
    };

    // Listen for source data changes
    map.on('sourcedata', handleSourceData);
    processSourceFeatures(); // Initial processing

    return () => {
      map.off('sourcedata', handleSourceData);
      processSourceFeatures.cancel();
    };
  }, [map, eventTypes]);

  // Add click handler for cluster layers
  useEffect(() => {
    if (!map) return;

    // Handle cluster click to zoom in
    const handleClusterClick = (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [CLUSTER_LAYER_ID]
      });

      if (!features.length) return;

      const clusterId = features[0].properties.cluster_id;
      const clusterSource = map.getSource(CLUSTER_SOURCE_ID);

      if (!clusterSource) return;

      clusterSource.getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;

          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    };

    map.on('click', CLUSTER_LAYER_ID, handleClusterClick);

    return () => {
      map.off('click', CLUSTER_LAYER_ID, handleClusterClick);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    // Gather features for the label source
    const features = map.querySourceFeatures?.(SOURCE_ID, { sourceLayer: 'events' }) || [];
    const geojsonFeatures = features
      .filter(feature => feature.id != null && feature.geometry.type === 'Point')
      .map(feature => {
        // Format the date if available
        let date_formatted = '';
        if (feature.properties.time) {
          try {
            const date = new Date(feature.properties.time);
            date_formatted = date.toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            });
          } catch (e) {
            console.warn('Error formatting date for event', feature.id);
          }
        }

        return {
          type: 'Feature',
          geometry: feature.geometry,
          properties: {
            id: feature.id,
            display_title: displayTitleForEvent(feature.properties, eventTypes),
            date_formatted
          }
        };
      });

    // Add or update the label source
    const labelSource = map.getSource(LABEL_SOURCE_ID);
    const data = {
      type: 'FeatureCollection',
      features: geojsonFeatures
    };
    if (labelSource) {
      labelSource.setData(data);
    } else {
      map.addSource(LABEL_SOURCE_ID, {
        type: 'geojson',
        data
      });
    }

    // Add the label layer if it doesn't exist
    if (!map.getLayer(LABEL_LAYER_ID)) {
      map.addLayer({
        id: LABEL_LAYER_ID,
        type: 'symbol',
        source: LABEL_SOURCE_ID,
        filter: ['==', '$type', 'Point'],
        layout: {
          // Use Mapbox format expression for two-line label with title and date
          'text-field': [
            'format',
            ['get', 'display_title'], { 'font-scale': 1.0 },
            '\n',
            ['case',
              ['has', 'date_formatted'],
              ['get', 'date_formatted'],
              ''
            ], { 'font-scale': 0.8 }
          ],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 15,
          'text-anchor': 'top',
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'symbol-avoid-edges': false
        },
        paint: {
          'text-color': '#fff',
          'text-halo-color': '#222',
          'text-halo-width': 2,
          'text-halo-blur': 0.5,
          'text-translate': [0, 4],
          'text-translate-anchor': 'viewport'
        }
      }, map.getLayer(LAYER_ID) ? LAYER_ID : undefined);
    }
  }, [map, eventTypes]);

  useEffect(() => {
    if (!map) return;

    const clickHandler = (e) => {
      if (!e.features.length) return;
      const feature = e.features[0];
      console.log({ feature });
      onEventClick(feature);
    };

    map.on('click', LAYER_ID, clickHandler);
    map.on('click', `${LAYER_ID}-circle`, clickHandler);
    map.on('click', `${LAYER_ID}-polygon`, clickHandler);
    map.on('click', `${LAYER_ID}-dot`, clickHandler);

    return () => {
      map.off('click', LAYER_ID, clickHandler);
      map.off('click', `${LAYER_ID}-circle`, clickHandler);
      map.off('click', `${LAYER_ID}-polygon`, clickHandler);
      map.off('click', `${LAYER_ID}-dot`, clickHandler);
    };
  }, [map, onEventClick]);

  useEffect(() => {
    if (!map) return;

    const layers = [
      LAYER_ID,
      `${LAYER_ID}-circle`,
      `${LAYER_ID}-polygon`,
      `${LAYER_ID}-pointer`,
      `${LAYER_ID}-dot`
    ];

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    layers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.on('mouseenter', layerId, handleMouseEnter);
        map.on('mouseleave', layerId, handleMouseLeave);
      }
    });

    return () => {
      layers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.off('mouseenter', layerId, handleMouseEnter);
          map.off('mouseleave', layerId, handleMouseLeave);
        }
      });
    };
  }, [map]);

  // Add this new effect for hiding vector features when clustered
  useEffect(() => {
    if (!map) return;

    // Layers from the vector source that should hide clustered features
    const layersToHide = [
      LAYER_ID,
      `${LAYER_ID}-circle`,
      `${LAYER_ID}-pointer`,
      `${LAYER_ID}-dot`
    ];

    // Updates which features should be hidden based on current clusters
    const updateHiddenFeatures = throttle(() => {
      const clusterSource = map.getSource(CLUSTER_SOURCE_ID);
      if (!clusterSource) return;

      // Get all visible clusters
      const clusters = map.queryRenderedFeatures({
        layers: [CLUSTER_LAYER_ID]
      });

      // If no clusters are visible, reset all filters
      if (clusters.length === 0) {
        layersToHide.forEach(layerId => {
          if (map.getLayer(layerId)) {
            // Reset to original filter
            const baseFilter = layerId === `${LAYER_ID}-polygon`
              ? ['==', '$type', 'Polygon']
              : ['==', '$type', 'Point'];
            map.setFilter(layerId, baseFilter);
          }
        });
        setClusteredFeatureIds(new Set());
        return;
      }

      // Process each cluster to find which feature IDs it contains
      const newClusteredIds = new Set();
      let pendingClusters = clusters.length;

      clusters.forEach(cluster => {
        const clusterId = cluster.properties.cluster_id;

        // Get points in this cluster
        clusterSource.getClusterLeaves(
          clusterId,
          100, // max points to retrieve
          0,   // offset for pagination
          (err, leaves) => {
            if (!err) {
              // Add each leaf's ID to our set
              leaves.forEach(leaf => {
                if (leaf.properties?.id) {
                  newClusteredIds.add(leaf.properties.id);
                }
              });
            }

            // When all clusters are processed, update filters
            pendingClusters--;
            if (pendingClusters === 0) {
              setClusteredFeatureIds(newClusteredIds);
              applyFilters(newClusteredIds);
            }
          }
        );
      });
    }, 200);

    // Apply filters to hide clustered features
    const applyFilters = (clusterIds) => {
      if (clusterIds.size === 0) return;

      const idsArray = Array.from(clusterIds);

      layersToHide.forEach(layerId => {
        if (!map.getLayer(layerId)) return;

        // Get base filter for this layer
        const baseFilter = layerId === `${LAYER_ID}-polygon`
          ? ['==', '$type', 'Polygon']
          : ['==', '$type', 'Point'];

        // Fix: Use correct filter syntax with direct property name
        // Mapbox expects: ['!in', 'propertyName', value1, value2, ...]
        const combinedFilter = [
          'all',
          baseFilter,
          ['!in', 'id', ...idsArray] // Use direct property name 'id' and spread the values
        ];

        map.setFilter(layerId, combinedFilter);
      });
    };

    // Listen for map events that might change clusters
    const handleZoomEnd = () => updateHiddenFeatures();
    const handleMoveEnd = () => updateHiddenFeatures();
    const handleSourceData = (e) => {
      if (e?.sourceId === CLUSTER_SOURCE_ID) {
        updateHiddenFeatures();
      }
    };

    map.on('zoomend', handleZoomEnd);
    map.on('moveend', handleMoveEnd);
    map.on('sourcedata', handleSourceData);

    // Initial update
    updateHiddenFeatures();

    return () => {
      map.off('zoomend', handleZoomEnd);
      map.off('moveend', handleMoveEnd);
      map.off('sourcedata', handleSourceData);
      updateHiddenFeatures.cancel();
    };
  }, [map]);

  // Add this effect to toggle layers based on zoom level
  useEffect(() => {
    if (!map) return;

    // Toggle layer visibility based on zoom
    const updateLayerVisibility = () => {
      const zoom = map.getZoom();

      // Only update if zoom crossed the threshold
      if (prevZoomRef.current !== null) {
        const previouslyBelowThreshold = prevZoomRef.current <= CLUSTER_ZOOM_THRESHOLD;
        const currentlyBelowThreshold = zoom <= CLUSTER_ZOOM_THRESHOLD;

        // If we didn't cross the threshold, no need to update
        if (previouslyBelowThreshold === currentlyBelowThreshold) {
          prevZoomRef.current = zoom;
          return;
        }
      }

      // Store current zoom for next comparison
      prevZoomRef.current = zoom;

      // Show clusters at lower zoom levels, show individual events at higher zooms
      const showClusters = zoom <= CLUSTER_ZOOM_THRESHOLD;

      // Vector tile layers to toggle
      const eventLayers = [
        LAYER_ID,
        `${LAYER_ID}-circle`,
        `${LAYER_ID}-pointer`,
        `${LAYER_ID}-dot`,
        `${LAYER_ID}-polygon`,
        LABEL_LAYER_ID
      ];

      // Toggle vector layer visibility
      eventLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(
            layerId,
            'visibility',
            showClusters ? 'none' : 'visible'
          );
        }
      });

      // Toggle cluster layers visibility
      const clusterLayers = [CLUSTER_LAYER_ID, CLUSTER_COUNT_LAYER_ID];
      clusterLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(
            layerId,
            'visibility',
            showClusters ? 'visible' : 'none'
          );
        }
      });
    };

    // Update visibility on first render
    updateLayerVisibility();

    // Update visibility when zoom changes
    const zoomHandler = () => {
      updateLayerVisibility();
    };

    map.on('zoom', zoomHandler);

    return () => {
      map.off('zoom', zoomHandler);
    };
  }, [map]);

  return null;
};

export default EventsVectorLayer;
