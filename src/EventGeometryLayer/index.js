import React, { useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { SOURCE_IDS, LAYER_IDS } from '../constants';
import { useMapLayer, useMapSource } from '../hooks';

import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';

import { PRIORITY_COLOR_MAP } from '../utils/events';

import { getShowReportsOnMap } from '../selectors/clusters';

const { EVENT_GEOMERY_LAYER_ID } = LAYER_IDS;

const { EVENT_GEOMETRY } = SOURCE_IDS;

const noPrio = PRIORITY_COLOR_MAP[0].base;
const lowPrio = PRIORITY_COLOR_MAP[100].base;
const medPrio = PRIORITY_COLOR_MAP[200].base;
const highPrio = PRIORITY_COLOR_MAP[300].base;

const layout = {};
const paint = {
  'fill-color': [
    'case',
    ['==', ['get', 'priority'], 100],
    lowPrio,
    ['==', ['get', 'priority'], 200],
    medPrio,
    ['==', ['get', 'priority'], 300],
    highPrio,
    noPrio,
  ],
  'fill-opacity': 0.6,
};

const EventGeometryLayer = () => {
  const showReportsOnMap = useSelector(getShowReportsOnMap);
  const eventFeatureCollection = useSelector(getMapEventFeatureCollectionWithVirtualDate);

  const layerConfig = {
    condition: showReportsOnMap,
    filter:
    [
      'all',
      ['has', 'event_type'],
      ['==', ['geometry-type'], 'Polygon'],
    ],
  };

  useMapSource(EVENT_GEOMETRY, eventFeatureCollection);

  useMapLayer(
    EVENT_GEOMERY_LAYER_ID,
    'fill',
    'whatever-the-source-may-be',
    paint,
    layout,
    layerConfig,
  );

  return null;
};

export default EventGeometryLayer;