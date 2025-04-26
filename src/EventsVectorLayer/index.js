import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MapContext } from '../App';
import { displayTitleForEvent } from '../utils/events';
import { PRIORITY_COLOR_MAP } from '../utils/events'; // <-- import the color map
import throttle from 'lodash/throttle';

const SOURCE_ID = 'event-vector-source';
const LAYER_ID = 'event-vector-layer';

const LABEL_LAYER_ID = `${LAYER_ID}-label`;
const LABEL_SOURCE_ID = 'event-labels-geojson';

const defaultEventStates = ['active', 'new'];

const API_HOST = process.env.NODE_ENV === 'production'
  ? window.location.origin
  : process.env.REACT_APP_DAS_HOST;

const EventsVectorLayer = (props) => {
  const { onEventClick } = props;
  const map = useContext(MapContext);
  map.showTileBoundaries = true;

  const eventTypes = useSelector(state => state.data.eventTypes);
  const eventFilter = useSelector(state => state.data.eventFilter);
  const token = useSelector((state) => state.data.token?.access_token);


  // useEffect(() => {
  //   if (!map) return;
  // TODO add marker image for use with subjects+events
  //   map.
  // }, [map]);

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

    return `${prodUrl}/tiles/{z}/{x}/{y}.mvt?${params.join('&')}`;
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

  useEffect(() => {
    if (!map) return;

    // Only handle sourcedata events for our vector source, and throttle to once per second
    const THROTTLE_MS = 1000;

    const setDisplayTitles = throttle(() => {
      const features = map.querySourceFeatures?.(SOURCE_ID, { sourceLayer: 'events' }) || [];
      const geojsonFeatures = [];
      console.log({ features });

      features.forEach(feature => {
        const display_title = displayTitleForEvent(feature.properties, eventTypes);
        geojsonFeatures.push({
          type: 'Feature',
          geometry: feature.geometry,
          properties: { id: feature.id, display_title }
        });
      });

      const source = map.getSource('event-labels-geojson');
      const data = { type: 'FeatureCollection', features: geojsonFeatures };
      source ? source.setData(data) : map.addSource('event-labels-geojson', { type: 'geojson', data });
    }, THROTTLE_MS, { leading: true, trailing: true });

    const displayTitleCallback = (e) => {
      if (e?.sourceId === SOURCE_ID || e?.source?.id === SOURCE_ID) {
        setDisplayTitles();
      }
    };

    map.on('sourcedata', displayTitleCallback);
    displayTitleCallback();

    return () => {
      map.off('sourcedata', displayTitleCallback);
      setDisplayTitles.cancel();
    };
  }, [map, eventTypes]);

  useEffect(() => {
    if (!map) return;



    // Gather features for the label source
    const features = map.querySourceFeatures?.(SOURCE_ID, { sourceLayer: 'events' }) || [];
    const geojsonFeatures = features
      .filter(feature => feature.id != null && feature.geometry.type === 'Point')
      .map(feature => ({
        type: 'Feature',
        geometry: feature.geometry,
        properties: {
          id: feature.id,
          display_title: displayTitleForEvent(feature.properties, eventTypes)
        }
      }));

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
          'text-field': ['get', 'display_title'],
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

  return null;
};

export default EventsVectorLayer;
