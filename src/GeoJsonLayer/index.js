import { featureCollection } from '@turf/helpers';
import React, { useContext, useEffect, useState } from 'react';

import { extractObjectDifference } from '../utils/objects';

import { MapContext } from '../App';
import { uuid } from '../utils/string';
import isEqual from 'react-fast-compare';

const eventToHandler = {
  touchstart: 'onTouchStart',
  touchend: 'onTouchEnd',
  touchcancel: 'onTouchCancel',
  mousemove: 'onMouseMove',
  mouseenter: 'onMouseEnter',
  mouseleave: 'onMouseLeave',
  mousedown: 'onMouseDown',
  mouseup: 'onMouseUp',
  click: 'onClick'
};

const convertEventsToHandlers = (props) =>
  Object.entries(eventToHandler).reduce((accumulator, [event, propName]) => {
    const handler = props[propName];
    if (handler) {
      return [...accumulator, [event, handler]];
    }
    return accumulator;
  },
  []);

const GeoJsonLayer = (props) => {
  const { before = null, data = featureCollection([]), id = uuid(), filter = null, layout = {}, paint = {}, type = 'line' } = props;
  const sourceId = `source-${id}`;
  const layerId = `layer-${id}`;

  const map = useContext(MapContext);

  const [statePaint, setStatePaint] = useState(paint);
  const [stateBefore, setStateBefore] = useState(before);
  const [stateLayout, setStateLayout] = useState(layout);
  const [stateFilter, setStateFilter] = useState(filter);
  const [stateHandlers, setStateHandlers] = useState([]);

  const canHandleLayerUpdate = !!map && !!map.getLayer(layerId);

  /* bootstrap the layer and change data if necessary */
  useEffect(() => {
    if (map) {
      const source = map.getSource(sourceId);
      const layer = map.getLayer(layerId);

      if (source) {
        source.setData(data);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data,
        });
      }

      if (!layer) {
        map.addLayer({
          before,
          id: layerId,
          source: sourceId,
          type,
          layout,
          paint,
        });

        map.setFilter(layerId, filter);
      }
    }
  }, [before, data, filter, layerId, layout, map, paint, sourceId, type]);

  /* update handlers in state */
  useEffect(() => {
    if (canHandleLayerUpdate) {
      const eventHandlers = convertEventsToHandlers(props);

      if (!isEqual(eventHandlers, stateHandlers)) {
        setStateHandlers(eventHandlers);
      }

    }
  }, [canHandleLayerUpdate, layerId, map, props, stateHandlers]);

  /* respond to new state handlers */
  useEffect(() => {
    if (canHandleLayerUpdate) {
      stateHandlers.forEach(([eventName, handler]) => {
        map.on(eventName, layerId, handler);
      });

      return () => {
        stateHandlers.forEach(([eventName, handler]) => {
          map.off(eventName, layerId, handler);
        });
      };
    }
  }, [canHandleLayerUpdate, layerId, map, stateHandlers]);


  /* update paint props, store new value in state */
  useEffect(() => {
    if (canHandleLayerUpdate) {
      if (!isEqual(paint, statePaint)) {
        const changes = extractObjectDifference(paint, statePaint);

        Object.entries(changes).forEach(([key, value]) => {
          map.setPaintProperty(layerId, key, value);
        });

        setStatePaint(paint);
      }
    }
  }, [canHandleLayerUpdate, layerId, map, paint, statePaint]);

  /* update layout props, store new value in state */
  useEffect(() => {
    if (canHandleLayerUpdate) {
      if (!isEqual(layout, stateLayout)) {
        const changes = extractObjectDifference(layout, stateLayout);

        Object.entries(changes).forEach(([key, value]) => {
          map.setLayoutProperty(layerId, key, value);
        });

        setStateLayout(layout);
      }
    }
  }, [canHandleLayerUpdate, layerId, layout, map, stateLayout]);

  /* update filter in state */
  useEffect(() => {
    if (canHandleLayerUpdate) {
      if (!isEqual(stateFilter, filter)) {
        map.setFilter(filter);
        setStateFilter(filter);
      }
    }
  }, [canHandleLayerUpdate, filter, map, stateFilter]);

  /* update before in state */
  useEffect(() => {
    if (map) {
      const layer = map.getLayer(layerId);

      if (!!layer) {
        if (!isEqual(stateBefore, before)) {
          map.moveLayer(layerId, before);
          setStateBefore(before);
        }

      }
    }
  }, [before, layerId, map, stateBefore]);

  useEffect(() => {
    const layer = map.getLayer(layerId);

    if (!!layer && layerId){
      return () => {
        !!map && map.removeLayer(layerId);
      };
    }
  }, [layerId, map]);

  return null;
};

export default GeoJsonLayer;