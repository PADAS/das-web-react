import { useContext, useEffect, useMemo, useRef } from 'react';

import { MapContext } from '../../App';


const useMapSource = (sourceConfig, defaultConfig = { type: 'geojson' }) => {
  const map = useContext(MapContext);
  const sourceIdsRef = useRef([]);
  const sourceConfigsBatch = useMemo(() => Array.isArray(sourceConfig) ? sourceConfig : [sourceConfig], [sourceConfig]);

  useEffect(() => {
    if (map) {
      sourceConfigsBatch.forEach(sourceConfig => {
        if (sourceConfig?.id && !map.getSource(sourceConfig.id)){
          const { id, data = {}, options = {} } = sourceConfig;
          const fullSourceConfig = { ...defaultConfig, ...options };
          map.addSource(id, {
            ...fullSourceConfig,
            data,
          });
          sourceIdsRef.current.push(id);
        }
      });
    }
  }, [map, sourceConfigsBatch, defaultConfig]);

  useEffect(() => {
    let timeouts = [];
    sourceConfigsBatch.forEach(sourceConfig => {
      const source = map?.getSource?.(sourceConfig?.id);
      if (sourceConfig?.id && sourceConfig?.data && source){
        const timeout = window.setTimeout(() => {
          source.setData(sourceConfig.data);
        });
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach(timeout => {
        window.clearTimeout(timeout);
      });
    };
  }, [map, sourceConfigsBatch]);

  useEffect(() => {
    const refs = sourceIdsRef?.current;
    return () => {
      if (map) {
        setTimeout(() => {
          refs.forEach(id => {
            if (map?.getSource(id)) {
              map.removeSource(id);
            }
          });
        });
      }
    };
  }, [map]);

  return sourceConfigsBatch
    .map((sourceConfig) => sourceConfig.id ? map?.getSource(sourceConfig.id) : null)
    .filter(sourceConfig => !!sourceConfig);
};

export default useMapSource;
