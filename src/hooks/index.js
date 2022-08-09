import { useContext, useState, useEffect, useRef } from 'react';
import { MapContext } from '../App';
import isEqual from 'react-fast-compare';
import { useSelector } from 'react-redux';
import noop from 'lodash/noop';

export const useFeatureFlag = flag =>
  useSelector(state =>
    !!state?.view?.systemConfig?.[flag]
  );

export const usePermissions = (permissionKey, ...permissions) =>  {
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

export const useDeepCompareEffect = (callback, dependencies) => {
  const valueRef = useRef();
  useEffect(() => {
    if (!isEqual(valueRef.current, dependencies)) {
      valueRef.current = dependencies;
      callback();
    }
  }, [callback, dependencies]);
};


export const useMapEventBinding = (eventType = 'click', handlerFn = noop, layerId = null, condition = true) => {
  const map = useContext(MapContext);

  useEffect(() => {
    const args = [eventType, layerId, handlerFn].filter(item => !!item);

    if (map) {
      if (condition) {
        map.on(...args);
        return () => {
          map.off(...args);
        };
      } else {
        map.off(...args);
      }
    }
  }, [map, condition, eventType, layerId, handlerFn]);
};

export const useMapSource = (sourceId, data, config = { type: 'geojson' }) => {
  const map = useContext(MapContext);
  let source = map.getSource(sourceId);

  useEffect(() => {
    if (map) {
      if (!source) {
        map.addSource(sourceId, {
          ...config,
          data,
        });
      }
    }
  }, [sourceId, source, config, data, map]);

  useEffect(() => {
    if (source) {
      source.setData(data);
    }
  }, [data, source]);

  useEffect(() => {
    return () => {
      if (map) {
        setTimeout(() => {
          source && map.removeSource(sourceId);
        });
      }
    };
  }, [sourceId, source, map]);

  return source;
};

export const useMapLayer = (layerId, type, sourceId, paint, layout, filter) => {
  const map = useContext(MapContext);

  const layer = map.getLayer(layerId);

  useEffect(() => {
    if (map && !layer) {
      const source = map.getSource(sourceId);

      if (!!source) {
        map.addLayer({
          id: layerId,
          source: sourceId,
          type,
          layout: layout || {},
          paint: paint || {},
        });
      }
    }
  }, [layer, layerId, layout, map, sourceId, paint, type]);

  useEffect(() => {
    if (layer && layout) {
      Object.entries(layout).forEach(([key, value]) => {
        layer.setLayoutProperty(key, value);
      });
    }
  }, [layer, layout]);

  useEffect(() => {
    if (layer && paint) {
      Object.entries(paint).forEach(([key, value]) => {
        layer.setPaintProperty(key, value);
      });
    }
  }, [layer, paint]);

  useEffect(() => {
    if (layer && filter) {
      layer.setFilter(filter);
    }
  }, [filter, layer]);

  useEffect(() => {
    return () => {
      map.getLayer(layerId) && map.removeLayer(layerId);
    };
  }, [layerId, map]);

  return layer;
};