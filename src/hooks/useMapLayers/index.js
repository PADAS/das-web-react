import { useContext, useEffect, useRef } from 'react';

import { MapContext } from '../../MapContext';

const assertLayerCondition = (layerConfig) => layerConfig?.options?.condition ?? true;

const shouldUpdateMapLayer = (layerConfig, map) => !!(
  layerConfig?.id
  && assertLayerCondition(layerConfig)
  && map.getLayer(layerConfig.id)
);

const useMapLayers = (layerConfigsBatch = []) => {
  const map = useContext(MapContext);
  const layerIdsRef = useRef([]);

  useEffect(() => {
    if (map){

      // Remove layers that are no longer in the configs
      const existingLayers = layerConfigsBatch.map(config => config.id).filter((id) => !!id);
      layerIdsRef.current.forEach(id => {
        if (!existingLayers.includes(id) && map.getLayer(id)) {
          map.removeLayer(id);
        }
      });

      // Add new layers
      layerConfigsBatch.forEach(layerConfig => {
        if (
          layerConfig?.id
          && layerConfig?.type
          && layerConfig?.sourceId
          && map.getSource(layerConfig.sourceId)
          && assertLayerCondition(layerConfig)
          && !map.getLayer(layerConfig.id)
        ){
          const beforeId = layerConfig?.options?.before;
          const before = layerConfig?.options?.beforeOptional && beforeId && !map.getLayer(beforeId)
            ? undefined
            : beforeId;
          map.addLayer(
            {
              id: layerConfig.id,
              source: layerConfig.sourceId,
              type: layerConfig.type,
              layout: layerConfig.layout ?? {},
              paint: layerConfig.paint ?? {},
              ...(
                Array.isArray(layerConfig.filter)
                  ? { filter: layerConfig.filter }
                  : {}
              )
            },
            before
          );

          layerIdsRef.current.push(layerConfig.id);
        }
      });
    }
  }, [map, layerConfigsBatch]);

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
        if (Array.isArray(layerConfig?.options?.filter) && shouldUpdateMapLayer(layerConfig, map)){
          map.setFilter(layerConfig.id, layerConfig.options.filter);
        }
      });
    }
  }, [map, layerConfigsBatch]);

  useEffect(() => {
    if (map) {
      layerConfigsBatch.forEach(layerConfig => {
        if ( layerConfig?.id && !assertLayerCondition(layerConfig) && map.getLayer(layerConfig.id) ){
          map.removeLayer(layerConfig.id);
        }
      });
    }
  }, [map, layerConfigsBatch]);

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
