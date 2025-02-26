import { useContext, useState, useEffect, useRef } from 'react';
import isEqual from 'react-fast-compare';
import { useSelector } from 'react-redux';
import noop from 'lodash/noop';


import { MapContext } from '../App';

import { DEVELOPMENT_FEATURE_FLAGS, MIN_ZOOM, MAX_ZOOM } from '../constants';

export const useSystemConfigFlag = (flag) => useSelector((state) => !!state?.view?.systemConfig?.[flag]);

export const useFeatureFlag = (flagName) => {
  const featureFlagOverrides = useSelector(state =>
    state.view.featureFlagOverrides
  );

  if (!DEVELOPMENT_FEATURE_FLAGS.hasOwnProperty(flagName)) {
    throw new Error('no feature flag with that name exists');
  }

  return featureFlagOverrides.hasOwnProperty(flagName)
    ? featureFlagOverrides[flagName].value
    : DEVELOPMENT_FEATURE_FLAGS[flagName];
};


export const usePermissions = (permissionKey, ...permissions) => {
  const permissionSet = useSelector(state => {
    const permissionsSource = state.data.selectedUserProfile?.id ? state.data.selectedUserProfile : state.data.user;

    return permissionsSource?.permissions?.[permissionKey];
  }
  )
    || [];

  return permissions.every(item => permissionSet.includes(item));
};

export const useMatchMedia = (matchMediaDef) => {
  const isClient = typeof window === 'object';

  const [isMatch, setMatchState] = useState(matchMediaDef.matches);

  useEffect(() => {
    if (!isClient) {
      return false;
    }

    const handleResize = () => {
      setMatchState(matchMediaDef.matches);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // eslint-disable-line

  return isMatch;
};

export const useMapEventBinding = (eventType = 'click', handlerFn = noop, layerId = null, condition = true) => {
  const map = useContext(MapContext);

  useEffect(() => {
    const args = [eventType, layerId, handlerFn].filter(item => !!item);

    if (map && condition) {
      map.on(...args);
    }

    return () => {
      map?.off?.(...args);
    };
  }, [map, condition, eventType, layerId, handlerFn]);
};

export const useMapSource = (sourceId, data, config = { type: 'geojson' }) => {
  const map = useContext(MapContext);
  useEffect(() => {
    if (map && !map?.getSource(sourceId)) {
      map.addSource(sourceId, {
        ...config,
        data,
      });
    }
  }, [sourceId, config, data, map]);

  useEffect(() => {
    let timeout;
    timeout = window.setTimeout(() => {
      const source = map?.getSource?.(sourceId);

      if (source) {
        source?.setData?.(data);
      }

    });
    return () => {
      window.clearTimeout(timeout);
    };
  }, [data, map, sourceId]);

  useEffect(() => {
    return () => {
      if (map) {
        setTimeout(() => {
          map?.getSource(sourceId) && map.removeSource(sourceId);
        });
      }
    };
  }, [sourceId, map]);

  return map?.getSource(sourceId);
};

export const useMapLayer = (layerId, type, sourceId, paint, layout, config = {}) => {
  const map = useContext(MapContext);
  const layer = map?.getLayer(layerId);

  const before = useMemoCompare(config?.before);
  const condition = useMemoCompare(config?.hasOwnProperty('condition') ? config.condition : true);
  const filter = useMemoCompare(config?.filter);
  const minzoom = useMemoCompare(config?.minZoom);
  const maxzoom = useMemoCompare(config?.maxZoom);

  useEffect(() => {
    if (condition && map && !layer) {
      if (!!map.getSource(sourceId)) {
        map.addLayer({
          id: layerId,
          source: sourceId,
          type,
          filter: config.hasOwnProperty(filter) ? filter : true,
          layout: layout || {},
          paint: paint || {},
        }, before);
      }
    }
  }, [before, condition, config, filter, layer, layerId, layout, map, sourceId, paint, type]);

  useEffect(() => {
    if (condition && layer && layout) {
      Object.entries(layout).forEach(([key, value]) => {
        map.setLayoutProperty(layerId, key, value);
      });
    }
  }, [condition, layer, layerId, layout, map]);

  useEffect(() => {
    if (condition && layer && paint) {
      Object.entries(paint).forEach(([key, value]) => {
        map.setPaintProperty(layerId, key, value);
      });
    }
  }, [condition, map, layer, layerId, paint]);

  useEffect(() => {
    if (condition && map && map.getLayer(layerId)) {
      map.setFilter(layerId, filter);
    }
  }, [condition, filter, layer, layerId, map]);

  useEffect(() => {
    if (!condition && layer) {
      map.removeLayer(layerId);
    }
  }, [condition, layer, layerId, map]);

  useEffect(() => {
    return () => {
      if (map) {
        try {
          map.getLayer(layerId) && map.removeLayer(layerId);
        } catch (error) {
          // console.warn('map unmount error', error);
        }
      }
    };
  }, [layerId, map]);

  useEffect(() => {
    if (condition && map && layer && (minzoom || maxzoom)) {
      map.setLayerZoomRange(layerId, (minzoom || MIN_ZOOM), (maxzoom || MAX_ZOOM));
    }
  }, [condition, layer, layerId, map, minzoom, maxzoom]);


  useEffect(() => {
    if (layerId && map && before) {
      map.getLayer(layerId) && map.moveLayer(layerId, before);
    }
  }, [before, layer, layerId, map]);

  return layer;
};


export const useMemoCompare = (next, compare = isEqual) => {
  const previousRef = useRef();
  const previous = previousRef.current;

  const isEqual = compare(previous, next);

  useEffect(() => {
    if (!isEqual) {
      previousRef.current = next;
    }
  }, [isEqual, next]);

  return isEqual ? previous : next;
};

/**
 * Hook to create multiple map sources at once
 * @param {Array} sourcesConfigs - Array of source configurations
 * @param {Object} defaultConfig - Default configuration for all sources
 */
export const useMapSourceBatch = (sourcesConfigs = [], defaultConfig = { type: 'geojson' }) => {
  const map = useContext(MapContext);

  // Track all sourceIds for cleanup
  const sourceIdsRef = useRef([]);

  useEffect(() => {
    // Initialize sources that don't exist yet
    if (map) {
      sourcesConfigs.forEach(config => {
        if (!config || !config.id || !config.data) return;

        const { id, data, options = {} } = config;
        const sourceConfig = { ...defaultConfig, ...options };

        if (!map.getSource(id)) {
          map.addSource(id, {
            ...sourceConfig,
            data,
          });
          sourceIdsRef.current.push(id);
        }
      });
    }
  }, [map, sourcesConfigs, defaultConfig]);

  // Update data for existing sources
  useEffect(() => {
    let timeouts = [];

    sourcesConfigs.forEach(config => {
      if (!config || !config.id || !config.data) return;

      const { id, data, options = {} } = config;
      const enabled = options.hasOwnProperty('enabled') ? options.enabled : true;

      if (!enabled) return;

      const timeout = window.setTimeout(() => {
        const source = map?.getSource?.(id);
        if (source) {
          source?.setData?.(data);
        }
      });

      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(timeout => {
        window.clearTimeout(timeout);
      });
    };
  }, [map, sourcesConfigs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map) {
        setTimeout(() => {
          sourceIdsRef.current.forEach(id => {
            if (map?.getSource(id)) {
              map.removeSource(id);
            }
          });
        });
      }
    };
  }, [map]);
};

/**
 * Hook to create multiple map layers at once
 * @param {Array} layersConfigs - Array of layer configurations
 * @param {Object} defaultConfig - Default configuration for all layers
 */
export const useMapLayerBatch = (layersConfigs = [], defaultConfig = {}) => {
  const map = useContext(MapContext);

  // Track all layerIds for cleanup
  const layerIdsRef = useRef([]);

  // Add layers that don't exist yet
  useEffect(() => {
    if (!map) return;

    // Handle global condition from defaultConfig
    const globalCondition = defaultConfig.hasOwnProperty('condition')
      ? defaultConfig.condition
      : true;

    // If global condition is false, remove all layers and return
    if (!globalCondition) {
      // Remove all previously added layers
      layerIdsRef.current.forEach(id => {
        if (map.getLayer(id)) {
          map.removeLayer(id);
        }
      });
      layerIdsRef.current = [];
      return;
    }

    // Get current layer IDs to track which ones should remain
    const currentLayerIds = layersConfigs.map(config => config.id).filter(Boolean);

    // Remove layers that are no longer in the configs
    layerIdsRef.current.forEach(id => {
      if (!currentLayerIds.includes(id) && map.getLayer(id)) {
        map.removeLayer(id);
      }
    });

    // Update our tracking reference with only current layers
    layerIdsRef.current = currentLayerIds.slice();

    // Add or update layers
    layersConfigs.forEach(config => {
      try {
        if (!config || !config.id || !config.type || !config.sourceId) {
          return;
        }

        const { id, type, sourceId, paint, layout, options = {} } = config;
        const condition = options.hasOwnProperty('condition') ? options.condition : true;
        const before = options.before || defaultConfig.before;

        // Check if source exists before trying to add layer
        if (!map.getSource(sourceId)) {
          return;
        }

        // Handle the layer based on condition
        if (condition) {
          if (!map.getLayer(id)) {
            // Build layer object
            const layerObj = {
              id,
              source: sourceId,
              type,
              layout: layout || {},
              paint: paint || {}
            };

            // Handle line-gradient and line-color conflict
            if (type === 'line' && paint?.['line-gradient'] && paint?.['line-color']) {
              // delete layerObj.paint['line-color'];
            }

            map.addLayer(layerObj, before);
          }
        } else {
          // If condition is false and layer exists, remove it
          if (map.getLayer(id)) {
            map.removeLayer(id);
            // We don't need to update layerIdsRef here as we've already
            // set it to currentLayerIds above
          }
        }
      } catch (error) {
        console.error('Error managing layer:', error, config);
      }
    });
  }, [map, layersConfigs, defaultConfig]);

  // Clean up all layers on unmount
  useEffect(() => {
    return () => {
      if (!map) return;

      layerIdsRef.current.forEach(id => {
        if (map.getLayer(id)) {
          try {
            map.removeLayer(id);
          } catch (err) {
            console.warn('Error removing layer on unmount:', err);
          }
        }
      });
    };
  }, [map]);
};
