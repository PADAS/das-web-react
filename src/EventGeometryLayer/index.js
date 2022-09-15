import React, { useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { SOURCE_IDS, LAYER_IDS } from '../constants';
import { useMapLayer } from '../hooks';

import { PRIORITY_COLOR_MAP } from '../utils/events';

import { getShouldEventsBeClustered, getShowReportsOnMap } from '../selectors/clusters';

const { EVENT_GEOMERY_LAYER_ID } = LAYER_IDS;

const { CLUSTERS_SOURCE_ID, UNCLUSTERED_EVENTS_SOURCE } = SOURCE_IDS;

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
  'fill-outline-color': 'blue',
};

const EventGeometryLayer = () => {
  const showReportsOnMap = useSelector(getShowReportsOnMap);
  const shouldEventsBeClustered = useSelector(getShouldEventsBeClustered);

  const layerConfig = {
    condition: showReportsOnMap,
    filter:
    [
      'all',
      ['has', 'event_type'],
      ['==', ['has', 'point_count'], false],
      ['==', ['geometry-type'], 'Point'],
    ],
  };

  const unclusteredLayerConfig = {
    ...layerConfig,
    condition: showReportsOnMap && !shouldEventsBeClustered,
  };

  useMapLayer(
    EVENT_GEOMERY_LAYER_ID,
    'fill',
    CLUSTERS_SOURCE_ID,
    paint,
    layout,
    layerConfig,
  );

  useMapLayer(
    EVENT_GEOMERY_LAYER_ID,
    'fill',
    UNCLUSTERED_EVENTS_SOURCE,
    paint,
    layout,
    unclusteredLayerConfig,
  );

  return null;
};

export default EventGeometryLayer;