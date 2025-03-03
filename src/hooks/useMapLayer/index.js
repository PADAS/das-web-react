import { useContext, useEffect, useMemo, useRef } from 'react';

import { MapContext } from '../../App';
import { MAX_ZOOM, MIN_ZOOM } from '../../constants';

const useMapLayer = (layerConfig, defaultConfig = {}) => {
  const map = useContext(MapContext);
  const layerIdsRef = useRef([]);
  const layersConfigs = useMemo(() => Array.isArray(layerConfig) ? layerConfig : [layerConfig], [layerConfig]);

  // Add layers that don't exist yet
  useEffect(() => {
    if (map){
      layersConfigs.forEach(config => {
        if (config?.id && config?.type && config?.sourceId){
          const { id, type, sourceId, paint = {}, layout = {}, filter, condition, before } = config;
          const conditionValue = condition ?? true;
          const beforeValue = before || defaultConfig.before;

          if (map.getSource(sourceId) && conditionValue && !map.getLayer(id)){
            const layerObj = {
              id,
              source: sourceId,
              type,
              layout: layout || {},
              paint: paint || {}
            };

            // Only add filter if it's defined and is an array
            const filterValue = filter || defaultConfig.filter;
            if (Array.isArray(filterValue)) {
              layerObj.filter = filterValue;
            }

            // Handle line-gradient and line-color conflict
            if (type === 'line' && paint?.['line-gradient'] && paint?.['line-color']) {
              console.warn(`Layer ${id}: line-gradient and line-color cannot both be specified`);
              delete layerObj.paint['line-color'];
            }

            map.addLayer(layerObj, beforeValue);
            layerIdsRef.current.push(id);
          }
        }
      });
    }
  }, [map, layerConfig, defaultConfig, layersConfigs]);

  // Update layout properties for existing layers
  useEffect(() => {
    if (map) {
      layersConfigs.forEach(config => {
        if (config?.id && config.layout){
          const { id, layout, condition } = config;

          if (( condition ?? true ) && map.getLayer(id) && layout) {
            Object.entries(layout).forEach(([key, value]) => {
              map.setLayoutProperty(id, key, value);
            });
          }
        }
      });
    }
  }, [map, layersConfigs, layerConfig]);

  // Update paint properties for existing layers
  useEffect(() => {
    if (map) {
      layersConfigs.forEach(config => {
        if (config?.id && config?.paint){
          const { id, paint, condition } = config;
          if (( condition ?? true ) && map.getLayer(id) && paint) {
            Object.entries(paint).forEach(([key, value]) => {
              map.setPaintProperty(id, key, value);
            });
          }
        }
      });
    }
  }, [map, layersConfigs, layerConfig]);

  // Update filters for existing layers
  useEffect(() => {
    if (map) {
      layersConfigs.forEach(config => {
        if (config?.id){
          const { id, filter, condition } = config;
          const filterValue = filter || defaultConfig.filter;

          // Only set filter if it's valid (must be an array)
          if (( condition ?? true ) && Array.isArray(filterValue) && map.getLayer(id)) {
            map.setFilter(id, filterValue);
          }
        }
      });
    }
  }, [map, layersConfigs, defaultConfig, layerConfig]);

  // Remove layers when condition becomes false
  useEffect(() => {
    if (map) {
      layersConfigs.forEach(config => {
        if (config?.id){
          const { id, condition } = config;
          if (!(condition ?? true) && map.getLayer(id)) {
            map.removeLayer(id);
          }
        }
      });
    }
  }, [map, layersConfigs, layerConfig]);

  // Update layer order based on before
  useEffect(() => {
    if (map) {
      layersConfigs.forEach(config => {
        if (config?.id){
          const { id, before } = config;
          const beforeValue = before || defaultConfig.before;

          if (beforeValue && map.getLayer(id)) {
            map.moveLayer(id, beforeValue);
          }
        }
      });
    }
  }, [map, layersConfigs, defaultConfig, layerConfig]);

  // Update zoom ranges
  useEffect(() => {
    if (map) {
      layersConfigs.forEach(config => {
        if (!config || !config.id) return;

        const { id, condition, minZoom, maxZoom } = config;
        const minZoomValue = minZoom || defaultConfig.minZoom || MIN_ZOOM;
        const maxZoomValue = maxZoom || defaultConfig.maxZoom || MAX_ZOOM;

        if (( condition ?? true ) && map.getLayer(id)) {
          map.setLayerZoomRange(id, minZoomValue, maxZoomValue);
        }
      });
    }
  }, [map, layersConfigs, defaultConfig, layerConfig]);

  // Cleanup on unmount
  useEffect(() => {
    const refs = layerIdsRef.current;
    return () => {
      if (map) {
        try {
          refs.forEach(id => {
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

  return layersConfigs.map((layer) => map?.getLayer(layer.id));
};

export default useMapLayer;
