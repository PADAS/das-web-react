import { useContext, useEffect, useRef } from 'react';

import { MapContext } from '../../App';
import { MAX_ZOOM, MIN_ZOOM } from '../../constants';

const hasLayerCondition = (layerConfig) => layerConfig?.options?.hasOwnProperty('condition')
  ? layerConfig.options.condition
  : true;

const shouldUpdateMapLayer = (layerConfig, map) => {
  return !!(
    !!layerConfig?.id
    && hasLayerCondition(layerConfig)
    && !!map.getLayer(layerConfig.id)
  );
};

const useMapLayers = (layerConfigsBatch = [], defaultConfig = {}) => {
  const map = useContext(MapContext);
  const layerIdsRef = useRef([]);

  useEffect(() => {
    if (map){
      layerConfigsBatch.forEach(layerConfig => {
        if (
          layerConfig?.id
          && layerConfig?.type
          && layerConfig?.sourceId
          && map.getSource(layerConfig.sourceId)
          && layerConfig?.options?.condition !== false
          && !map.getLayer(layerConfig.id)
        ){
          const {
            id,
            type,
            sourceId,
            paint = {},
            layout = {},
            options: {
              filter,
              before
            } = {}
          } = layerConfig;

          const layerObj = {
            id,
            source: sourceId,
            type,
            layout: layout,
            paint: paint
          };

          const filterValue = filter || defaultConfig.filter;
          if (Array.isArray(filterValue)) {
            layerObj.filter = filterValue;
          }

          // Handle line-gradient and line-color conflict
          if (type === 'line' && paint?.['line-gradient'] && paint?.['line-color']) {
            console.warn(`Layer ${id}: line-gradient and line-color cannot both be specified`);
            delete layerObj.paint['line-color'];
          }

          map.addLayer(layerObj, before || defaultConfig.before);
          layerIdsRef.current.push(id);
        }
      });
    }
  }, [map, defaultConfig, layerConfigsBatch]);

  useEffect(() => {
    if (map) {
      layerConfigsBatch.forEach(layerConfig => {
        if ( layerConfig.layout && shouldUpdateMapLayer(layerConfig, map) ){
          Object.entries(layerConfig.layout).forEach(([name, value]) => {
            map.setLayoutProperty(layerConfig.id, name, value);
          });
        }
      });
    }
  }, [map, layerConfigsBatch]);

  useEffect(() => {
    if (map) {
      layerConfigsBatch.forEach(layerConfig => {
        if ( layerConfig?.paint && shouldUpdateMapLayer(layerConfig, map) ){
          Object.entries(layerConfig.paint).forEach(([name, value]) => {
            map.setPaintProperty(layerConfig.id, name, value);
          });
        }
      });
    }
  }, [map, layerConfigsBatch]);

  useEffect(() => {
    if (map) {
      layerConfigsBatch.forEach(layerConfig => {
        const filter = layerConfig?.options?.filter || defaultConfig.filter;
        if (Array.isArray(filter) && shouldUpdateMapLayer(layerConfig, map)){
          map.setFilter(layerConfig.id, filter);
        }
      });
    }
  }, [map, layerConfigsBatch, defaultConfig]);

  useEffect(() => {
    if (map) {
      layerConfigsBatch.forEach(layerConfig => {
        if ( layerConfig?.id && !hasLayerCondition(layerConfig) && map.getLayer(layerConfig.id) ){
          map.removeLayer(layerConfig.id);
        }
      });
    }
  }, [map, layerConfigsBatch]);

  useEffect(() => {
    if (map) {
      layerConfigsBatch.forEach(layerConfig => {
        const before = layerConfig?.options?.before || defaultConfig.before;
        if (
          layerConfig?.id
          && before
          && map.getLayer(layerConfig.id)
        ){
          map.moveLayer(layerConfig.id, before);
        }
      });
    }
  }, [map, layerConfigsBatch, defaultConfig]);

  useEffect(() => {
    if (map) {
      layerConfigsBatch.forEach(layerConfig => {
        if ( shouldUpdateMapLayer(layerConfig, map) ) {
          const { options: { minZoom, maxZoom } = {} } = layerConfig;
          map.setLayerZoomRange(
            layerConfig.id,
            minZoom || defaultConfig.minZoom || MIN_ZOOM,
            maxZoom || defaultConfig.maxZoom || MAX_ZOOM
          );
        }
      });
    }
  }, [map, layerConfigsBatch, defaultConfig]);

  useEffect(() => {
    const refs = layerIdsRef.current;
    return () => {
      if (map) {
        try {
          refs.forEach(layerId => {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
            }
          });
        } catch (error) {
          // Silent error handling as in the original hook
        }
      }
    };
  }, [map]);

  return layerConfigsBatch
    .map((layerConfig) => layerConfig?.id ? map?.getLayer(layerConfig.id) : null)
    .filter(layerConfig => !!layerConfig);
};

export default useMapLayers;
