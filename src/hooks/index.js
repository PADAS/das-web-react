import { useContext, useState, useEffect, useRef } from 'react';
import { MapContext } from '../App';
import isEqual from 'react-fast-compare';
import { useSelector } from 'react-redux';
import noop from 'lodash/noop';

import { MIN_ZOOM, MAX_ZOOM } from '../constants';

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
  const source = map?.getSource(sourceId);

  useEffect(() => {
    if (map && !source) {
      map.addSource(sourceId, {
        ...config,
        data,
      });
    }
  }, [sourceId, source, config, data, map]);

  useEffect(() => {
    let timeout;
    if (source) {
      timeout = window.setTimeout(() => {
        source.setData?.(data);
      });
    }
    return () => {
      window.clearTimeout(timeout);
    };
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
      const source = map.getSource(sourceId);

      if (!!source) {
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
