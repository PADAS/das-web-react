import React, { Fragment, memo } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';

import WithMapNames from '../WithMapNames';
import { withMap } from '../EarthRangerMap';
import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

const { EVENT_CLUSTERS_CIRCLES, EVENT_CLUSTER_COUNT_SYMBOLS, EVENT_SYMBOLS } = LAYER_IDS;


const MAP_EVENT_CLUSTER_SOURCE_OPTIONS = {
  cluster: true,
  clusterMaxZoom: 17, // Max zoom to cluster points on
  clusterRadius: 40,
};

const clusterLayerOptions = {
  filter: ['has', 'point_count'],
};

const clusterSymbolLayout = {
  'icon-pitch-alignment': 'map',
};

const clusterPaint = {
  'circle-color': [
    'step',
    ['get', 'point_count'],
    '#51bbd6',
    25,
    '#f28cb1'
  ],
  'circle-radius': [
    'case',
    ['<', ['get', 'point_count'], 10], 15,
    ['>', ['get', 'point_count'], 10], 25,
    15,
  ]
};

const clusterCountSymbolLayout = {
  'text-field': '{point_count_abbreviated}',
  'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
  'text-size': 12
};


const eventSymbolLayerOptions = {
  filter: ['!has', 'point_count'],
};

const eventSymbolLayerLayout = {
  ...DEFAULT_SYMBOL_LAYOUT,
  'text-field': '{display_title}',
};

const eventSymbolLayerPaint = {
  ...DEFAULT_SYMBOL_PAINT,
};

const getEventLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.type === 'symbol')[0];

const EventsLayer = (props) => {
  const { events, onEventClick, onClusterClick, enableClustering, mapNameLayout, map, ...rest } = props;

  const handleEventClick = (e) => {
    onEventClick(getEventLayer(e, map));
  };

  const eventSymbolLayerLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    'text-field': '{display_title}',
    ...mapNameLayout,
  };

  return <Fragment>
    <GeoJSONLayer
      id={EVENT_CLUSTERS_CIRCLES}
      data={events}
      circleOnClick={onClusterClick}
      sourceOptions={MAP_EVENT_CLUSTER_SOURCE_OPTIONS}
      layerOptions={clusterLayerOptions}
      symbolLayout={clusterSymbolLayout}
      circlePaint={clusterPaint} />
    <GeoJSONLayer
      id={EVENT_CLUSTER_COUNT_SYMBOLS}
      data={events}
      sourceOptions={MAP_EVENT_CLUSTER_SOURCE_OPTIONS}
      layerOptions={clusterLayerOptions}
      symbolLayout={clusterCountSymbolLayout} />

    <GeoJSONLayer
      id={EVENT_SYMBOLS}
      {...rest}
      data={events}
      symbolOnClick={handleEventClick}
      sourceOptions={MAP_EVENT_CLUSTER_SOURCE_OPTIONS}
      layerOptions={eventSymbolLayerOptions}
      symbolPaint={eventSymbolLayerPaint}
      symbolLayout={eventSymbolLayerLayout} />
  </Fragment>;
};

export default memo(WithMapNames(withMap(EventsLayer)));

EventsLayer.defaultProps = {
  onClusterClick() {
  },
  onEventClick() {
  },
  enableClustering: true,
};

EventsLayer.propTypes = {
  events: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  onEventClick: PropTypes.func,
  onClusterClick: PropTypes.func,
  enableClustering: PropTypes.bool,
};