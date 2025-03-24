import { useContext, useEffect, useRef } from 'react';

import { MapContext } from '../../App';

const DEFAULT_CONFIGURATION = { type: 'geojson' };

const useMapSources = (sourceConfigurations = [], defaultConfiguration = DEFAULT_CONFIGURATION) => {
  const map = useContext(MapContext);

  const idsOfSourcesAddedToMapRef = useRef([]);

  useEffect(() => {
    if (map) {
      sourceConfigurations.forEach((sourceConfiguration) => {
        const source = map.getSource(sourceConfiguration.id);
        if (source) {
          // If the source is already in the map, update its data.
          source.setData(sourceConfiguration.data);
        } else {
          // If the source is not in the map yet, add it.
          map.addSource(sourceConfiguration.id, {
            ...defaultConfiguration,
            ...sourceConfiguration.options,
            data: sourceConfiguration.data,
          });

          idsOfSourcesAddedToMapRef.current = [...idsOfSourcesAddedToMapRef.current, sourceConfiguration.id];
        }
      });
    }
  }, [defaultConfiguration, map, sourceConfigurations]);

  useEffect(() => {
    if (map) {
      const idsOfSourcesAddedToMap = idsOfSourcesAddedToMapRef.current;

      // Remove the sources from the map on unmount.
      return () => setTimeout(() => idsOfSourcesAddedToMap.forEach((sourceId) => {
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      }));
    }
  }, [map]);

  // Return the sources that are already defined in the map.
  return sourceConfigurations
    .map((sourceConfiguration) => map?.getSource(sourceConfiguration.id))
    .filter((source) => !!source);
};

export default useMapSources;
