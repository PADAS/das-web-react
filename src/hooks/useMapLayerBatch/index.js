import { useContext, useEffect, useRef } from 'react';

import { MapContext } from '../../App';
import { MAX_ZOOM, MIN_ZOOM } from '../../constants';

const useMapLayerBatch = (layersConfigs = [], defaultConfig = {}) => {
  const map = useContext(MapContext);
  const layerIdsRef = useRef([]);

  // Add layers that don't exist yet
  useEffect(() => {
    if (!map) return;

    layersConfigs.forEach(config => {
      try {
        if (config?.id && config?.type && config?.sourceId){
          const { id, type, sourceId, paint = {}, layout = {}, options = {} } = config;
          const condition = options.condition ?? true;
          const before = options.before || defaultConfig.before;

          if (map.getSource(sourceId) && condition && !map.getLayer(id)){
            const layerObj = {
              id,
              source: sourceId,
              type,
              layout: layout || {},
              paint: paint || {}
            };

            // Only add filter if it's defined and is an array
            const filterValue = options.filter || defaultConfig.filter;
            if (Array.isArray(filterValue)) {
              layerObj.filter = filterValue;
            }

            // Handle line-gradient and line-color conflict
            if (type === 'line' && paint?.['line-gradient'] && paint?.['line-color']) {
              console.warn(`Layer ${id}: line-gradient and line-color cannot both be specified`);
              delete layerObj.paint['line-color'];
            }

            map.addLayer(layerObj, before);
            layerIdsRef.current.push(id);
          }
        }
      } catch (error) {
        console.error('Error adding layer for config:', config, error);
      }
    });
  }, [map, layersConfigs, defaultConfig]);

  // Update layout properties for existing layers
  useEffect(() => {
    if (map) {
      layersConfigs.forEach(config => {
        if (!config || !config.id || !config.layout) return;

        const { id, layout, options = {} } = config;
        const condition = options.hasOwnProperty('condition') ? options.condition : true;

        if (condition && map.getLayer(id) && layout) {
          Object.entries(layout).forEach(([key, value]) => {
            map.setLayoutProperty(id, key, value);
          });
        }
      });
    }
  }, [map, layersConfigs]);

  // Update paint properties for existing layers
  useEffect(() => {
    if (map) {
      layersConfigs.forEach(config => {
        if (!config || !config.id || !config.paint) return;

        const { id, paint, options = {} } = config;
        const condition = options.hasOwnProperty('condition') ? options.condition : true;

        if (condition && map.getLayer(id) && paint) {
          Object.entries(paint).forEach(([key, value]) => {
            map.setPaintProperty(id, key, value);
          });
        }
      });
    }
  }, [map, layersConfigs]);

  // Update filters for existing layers
  useEffect(() => {
    if (map) {
      layersConfigs.forEach(config => {
        if (!config || !config.id) return;

        const { id, options = {} } = config;
        const condition = options.hasOwnProperty('condition') ? options.condition : true;
        const filter = options.filter || defaultConfig.filter;

        // Only set filter if it's valid (must be an array)
        if (condition && Array.isArray(filter) && map.getLayer(id)) {
          map.setFilter(id, filter);
        }
      });
    }
  }, [map, layersConfigs, defaultConfig]);

  // Remove layers when condition becomes false
  useEffect(() => {
    if (map) {
      layersConfigs.forEach(config => {
        if (!config || !config.id) return;

        const { id, options = {} } = config;
        const condition = options.hasOwnProperty('condition') ? options.condition : true;

        if (!condition && map.getLayer(id)) {
          map.removeLayer(id);
        }
      });
    }
  }, [map, layersConfigs]);

  // Update layer order based on before
  useEffect(() => {
    if (map) {
      layersConfigs.forEach(config => {
        if (!config || !config.id) return;

        const { id, options = {} } = config;
        const before = options.before || defaultConfig.before;

        if (before && map.getLayer(id)) {
          map.moveLayer(id, before);
        }
      });
    }
  }, [map, layersConfigs, defaultConfig]);

  // Update zoom ranges
  useEffect(() => {
    if (map) {
      layersConfigs.forEach(config => {
        if (!config || !config.id) return;

        const { id, options = {} } = config;
        const condition = options.hasOwnProperty('condition') ? options.condition : true;
        const minzoom = options.minZoom || defaultConfig.minZoom || MIN_ZOOM;
        const maxzoom = options.maxZoom || defaultConfig.maxZoom || MAX_ZOOM;

        if (condition && map.getLayer(id)) {
          map.setLayerZoomRange(id, minzoom, maxzoom);
        }
      });
    }
  }, [map, layersConfigs, defaultConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map) {
        try {
          layerIdsRef.current.forEach(id => {
            if (map.getLayer(id)) {
              map.removeLayer(id);
            }
          });
        } catch (error) {
          // Silent error handling as in the original hook
        }
      }
    };
  }, [map]);
};

export default useMapLayerBatch;
