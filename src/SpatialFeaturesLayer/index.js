import React, { memo, useContext, useEffect } from 'react';
import { MapContext } from '../App';
import { DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

// Configuration constants - moved outside component to prevent re-creation
const SOURCE_ID = 'spatial-features-source';
const POINTS_LAYER_ID = 'spatial-features-points';
const LINES_LAYER_ID = 'spatial-features-lines';
const POLYGONS_LAYER_ID = 'spatial-features-polygons';

// Build the vector tile URL from environment variable
const VECTOR_TILE_URL = `${process.env.REACT_APP_DAS_HOST}/api/v1.0/spatialfeatures/tiles/{z}/{x}/{y}.pbf`;

// Active feature state management
const ACTIVE_FEATURE_STATE = 'active';
const IF_ACTIVE = (activeProp) => [['boolean', ['feature-state', ACTIVE_FEATURE_STATE], false], activeProp];

// Helper for feature properties with fallback values
const IF_HAS_PROPERTY = (prop, defaultValue) => {
  return [['has', prop], ['get', prop], defaultValue];
};

// Data-driven styling with active states (similar to FeatureLayer)
const symbolLayout = {
  ...DEFAULT_SYMBOL_LAYOUT,
  'icon-image': ['case',
    ['==', ['get', 'title'], 'Ranger Stations'], 'ranger-stations',
    ['has', 'image'], DEFAULT_SYMBOL_LAYOUT['icon-image'],
    'marker-icon',
  ],
  'text-size': 0,
  'icon-anchor': 'center',
};

const symbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
};

const linesPaint = {
  'line-color': [
    'case',
    ...IF_ACTIVE('blue'), // Blue when active
    ...IF_HAS_PROPERTY('stroke', 'orange'), // Use feature's stroke property or orange
  ],
  'line-width': [
    'case',
    ...IF_ACTIVE(6), // Thicker when active
    ...IF_HAS_PROPERTY('stroke-width', 4), // Use feature's stroke-width or 4
  ],
  'line-opacity': [
    'case',
    ...IF_HAS_PROPERTY('stroke-opacity', 1), // Use feature's stroke-opacity or 1
  ]
};

const polygonsPaint = {
  'fill-color': [
    'case',
    ...IF_ACTIVE('blue'), // Blue when active
    ...IF_HAS_PROPERTY('fill', 'orange'), // Use feature's fill property or orange
  ],
  'fill-opacity': [
    'case',
    ...IF_ACTIVE(0.5), // More opaque when active
    ...IF_HAS_PROPERTY('fill-opacity', 0.3), // Use feature's fill-opacity or 0.3
  ],
  'fill-outline-color': [
    'case',
    ...IF_ACTIVE('blue'), // Blue outline when active
    ...IF_HAS_PROPERTY('stroke', 'orange'), // Use feature's stroke or orange
  ]
};

const SpatialFeaturesLayer = ({ onFeatureClick }) => {
  const map = useContext(MapContext);

  // One-time setup effect for source and layers (no dependencies that change)
  useEffect(() => {
    if (!map) return;

    // Add vector tile source with error handling
    if (!map.getSource(SOURCE_ID)) {
      try {
        map.addSource(SOURCE_ID, {
          type: 'vector',
          tiles: [VECTOR_TILE_URL],
          minzoom: 3,
          maxzoom: 22,
        });
      } catch (error) {
        console.warn('Failed to add spatial features source:', error);
        return;
      }
    }

    // Add Points layer with symbol styling
    if (!map.getLayer(POINTS_LAYER_ID)) {
      try {
        map.addLayer({
          id: POINTS_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          'source-layer': 'spatial_features',
          layout: symbolLayout,
          paint: symbolPaint,
          filter: ['==', ['geometry-type'], 'Point']
        });
      } catch (error) {
        console.warn('Failed to add spatial features points layer:', error);
      }
    }

    // Add Lines layer with enhanced styling
    if (!map.getLayer(LINES_LAYER_ID)) {
      try {
        map.addLayer({
          id: LINES_LAYER_ID,
          type: 'line',
          source: SOURCE_ID,
          'source-layer': 'spatial_features',
          paint: linesPaint,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          filter: ['==', ['geometry-type'], 'LineString']
        });
      } catch (error) {
        console.warn('Failed to add spatial features lines layer:', error);
      }
    }

    // Add Polygons layer with enhanced styling
    if (!map.getLayer(POLYGONS_LAYER_ID)) {
      try {
        map.addLayer({
          id: POLYGONS_LAYER_ID,
          type: 'fill',
          source: SOURCE_ID,
          'source-layer': 'spatial_features',
          paint: polygonsPaint,
          filter: ['==', ['geometry-type'], 'Polygon']
        });
      } catch (error) {
        console.warn('Failed to add spatial features polygons layer:', error);
      }
    }

    // Cleanup function - only removes layers and source when component unmounts
    return () => {
      const layerIds = [POINTS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID];

      layerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
          try {
            map.removeLayer(layerId);
          } catch (error) {
            console.warn(`Failed to cleanup layer ${layerId}:`, error);
          }
        }
      });

      if (map.getSource(SOURCE_ID)) {
        try {
          map.removeSource(SOURCE_ID);
        } catch (error) {
          console.warn('Failed to remove spatial features source:', error);
        }
      }
    };
  }, [map]); // Only depends on map

  // Separate effect for event handlers that can change
  useEffect(() => {
    if (!map) return;

    const layerIds = [POINTS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID];

    // Clear active states from all features (similar to FeatureLayer)
    const clearActiveStates = () => {
      layerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
          try {
            map.queryRenderedFeatures({ layers: [layerId] }).forEach(feature => {
              map.setFeatureState(
                { source: SOURCE_ID, sourceLayer: 'spatial_features', id: feature.id },
                { [ACTIVE_FEATURE_STATE]: false }
              );
            });
          } catch (error) {
            console.warn(`Failed to clear active states for layer ${layerId}:`, error);
          }
        }
      });
    };

    // Click handler for all spatial features
    const handleFeatureClick = (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: layerIds
      });

      if (features.length > 0) {
        const feature = features[0];

        // Clear other active states
        clearActiveStates();

        // Set clicked feature as active
        if (feature.id) {
          try {
            map.setFeatureState(
              { source: SOURCE_ID, sourceLayer: 'spatial_features', id: feature.id },
              { [ACTIVE_FEATURE_STATE]: true }
            );
          } catch (error) {
            console.warn('Failed to set feature active state:', error);
          }
        }

        // Call the provided click handler
        if (onFeatureClick) {
          onFeatureClick(feature);
        }
      }
    };

    // Mouse cursor handlers
    const onMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const onMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    // Map click handler to clear active states (similar to FeatureLayer)
    const onMapClick = () => {
      clearActiveStates();
    };

    // Add event listeners only to existing layers
    layerIds.forEach(layerId => {
      if (map.getLayer(layerId)) {
        try {
          map.on('click', layerId, handleFeatureClick);
          map.on('mouseenter', layerId, onMouseEnter);
          map.on('mouseleave', layerId, onMouseLeave);
        } catch (error) {
          console.warn(`Failed to add event listeners for layer ${layerId}:`, error);
        }
      }
    });

    // Add general map click handler
    map.on('click', onMapClick);

    // Cleanup function - only removes event listeners
    return () => {
      layerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
          try {
            map.off('click', layerId, handleFeatureClick);
            map.off('mouseenter', layerId, onMouseEnter);
            map.off('mouseleave', layerId, onMouseLeave);
          } catch (error) {
            console.warn(`Failed to cleanup event listeners for layer ${layerId}:`, error);
          }
        }
      });

      map.off('click', onMapClick);
    };
  }, [map, onFeatureClick]); // Only re-run when map or onFeatureClick changes

  return null;
};

export default memo(SpatialFeaturesLayer);
