import { useContext, useEffect, useRef } from 'react';

import { MapContext } from '../../App';

const useMapSourceBatch = (sourcesConfigs = [], defaultConfig = { type: 'geojson' }) => {
  const map = useContext(MapContext);
  const sourceIdsRef = useRef([]);

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
    return () => {
      if (map) {
        setTimeout(() => {
          sourceIdsRef?.current.forEach(id => {
            if (map?.getSource(id)) {
              map.removeSource(id);
            }
          });
        });
      }
    };
  }, [map]);
};

export default useMapSourceBatch;
