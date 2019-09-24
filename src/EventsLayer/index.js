import React, { Fragment, memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';

import { addFeatureCollectionImagesToMap } from '../utils/map';

import { withMap } from '../EarthRangerMap';
import withMapNames from '../WithMapNames';

import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

const { EVENT_CLUSTERS_CIRCLES, EVENT_CLUSTER_COUNT_SYMBOLS, EVENT_SYMBOLS } = LAYER_IDS;

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
  'icon-optional': true,
  'icon-pitch-alignment': 'map',
  'text-field': '{point_count_abbreviated}',
  'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
  'text-size': 12
};



const eventSymbolLayerPaint = {
  ...DEFAULT_SYMBOL_PAINT,
  'text-halo-color': ['case',
    ['has', 'distanceFromVirtualDate'],
    ['interpolate', ['linear'], ['abs', ['get', 'distanceFromVirtualDate']], 0, 'rgba(255, 255, 126, 1)', .225, 'rgba(255,255,255,0.7)'],
    'rgba(255,255,255,0.7)',
  ],
};

const getEventLayer = (e, map) => map.queryRenderedFeatures(e.point, { layers: [LAYER_IDS.EVENT_SYMBOLS] })[0];

const EventsLayer = (props) => {
  const { events, onEventClick, onClusterClick, enableClustering, map, mapNameLayout, ...rest } = props;

  useEffect(() => {
    !!events && addFeatureCollectionImagesToMap(events, map);
  }, [events]);

  const handleEventClick = (e) => {
    e.preventDefault();
    e.originalEvent.stopPropagation();
    const clickedLayer = getEventLayer(e, map);
    onEventClick(clickedLayer);
  };

  const eventClusterDisabledLayout = enableClustering ? {} : {
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
  };

  const eventSymbolLayerLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    'text-field': '{display_title}',
    ...mapNameLayout,
    ...eventClusterDisabledLayout,
  };

  const clusterConfig = {
    cluster: true,
    clusterMaxZoom: 17, // Max zoom to cluster points on
    clusterRadius: 40,
  };

  const sourceData = {
    type: 'geojson',
    data: events,
  };

  const clusteredSourceData = {
    ...sourceData,
    ...clusterConfig,
  };

  return <Fragment>
    <Source id='events-data-clustered' geoJsonSource={clusteredSourceData} />
    <Source id='events-data-unclustered' geoJsonSource={sourceData} />

    {!enableClustering && <Layer geoJSONSourceOptions={clusterConfig} sourceId='events-data-unclustered' id={EVENT_SYMBOLS} type='symbol'
      onClick={handleEventClick} paint={eventSymbolLayerPaint}
      layout={eventSymbolLayerLayout} {...rest} />}

    {enableClustering && <Layer geoJSONSourceOptions={clusterConfig} sourceId='events-data-clustered' id={EVENT_SYMBOLS} type='symbol'
      filter={['!has', 'point_count']}
      onClick={handleEventClick} paint={eventSymbolLayerPaint}
      layout={eventSymbolLayerLayout} {...rest} />}


    {enableClustering && <Layer geoJSONSourceOptions={clusterConfig} sourceId='events-data-clustered' id={EVENT_CLUSTER_COUNT_SYMBOLS} type='symbol'
      filter={['has', 'point_count']} layout={clusterCountSymbolLayout} />}

    {enableClustering && <Layer geoJSONSourceOptions={clusterConfig} before={EVENT_CLUSTER_COUNT_SYMBOLS} sourceId='events-data-clustered' id={EVENT_CLUSTERS_CIRCLES} type='circle'
      filter={['has', 'point_count']} onClick={onClusterClick} paint={clusterPaint} />}
  </Fragment>;
};

export default memo(withMapNames(withMap(EventsLayer)));

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