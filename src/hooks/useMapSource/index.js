import { useContext, useEffect, useMemo, useRef } from 'react';

import { MapContext } from '../../App';

const useMapSource = (sourceConfig, defaultConfig = { type: 'geojson' }) => {
  const map = useContext(MapContext);
  const sourceIdsRef = useRef([]);
  const sourcesConfigs = useMemo(() => Array.isArray(sourceConfig) ? sourceConfig : [sourceConfig], [sourceConfig]);

  useEffect(() => {
    // Initialize sources that don't exist yet
    if (map) {
      sourcesConfigs.forEach(config => {
        if (!!config?.id && !!config?.data){
          const { id, data, options = {} } = config;
          const sourceConfig = { ...defaultConfig, ...options };

          if (!map.getSource(id)) {
            map.addSource(id, {
              ...sourceConfig,
              data,
            });
            sourceIdsRef.current.push(id);
          }
        }
      });
    }
  }, [map, sourcesConfigs, defaultConfig]);

  // Update data for existing sources
  useEffect(() => {
    let timeouts = [];
    sourcesConfigs.forEach(config => {
      if (!!config?.id && !!config?.data){
        const { id, data } = config;
        const timeout = window.setTimeout(() => {
          const source = map?.getSource?.(id);
          if (source) {
            source?.setData?.(data);
          }
        });
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach(timeout => {
        window.clearTimeout(timeout);
      });
    };
  }, [map, sourcesConfigs]);

  // Cleanup on unmount
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

  return sourcesConfigs.map((source) => map?.getSource(source.id));
};

export default useMapSource;
