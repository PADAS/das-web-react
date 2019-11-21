import React, { Fragment, memo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';

import { addFeatureCollectionImagesToMap, addMapImage } from '../utils/map';

import { withMap } from '../EarthRangerMap';
import withMapNames from '../WithMapNames';
import ClusterIcon from '../common/images/icons/cluster-icon.svg';

import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

const { EVENT_CLUSTERS_CIRCLES, SUBJECT_SYMBOLS, EVENT_SYMBOLS } = LAYER_IDS;

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

const clusterSymbolLayout = {
  'icon-image': 'event-cluster-icon',
  'icon-allow-overlap': true,
  'icon-pitch-alignment': 'map',
  'text-allow-overlap': true,
  'text-field': '{point_count_abbreviated}',
  'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
  'text-size': 12,
  'text-offset': [-0.8, -0.8],
};

const clusterSymbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
  'text-halo-color': 'rgba(255,255,255,1)',
  'text-halo-width': 3,
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

  const addClusterIconToMap = async () => {
    if (!map.hasImage('event-cluster-icon')) {
      addMapImage('event-cluster-icon', ClusterIcon);
    }
  };

  const handleEventClick = useRef((e) => {
    e.preventDefault();
    e.originalEvent.stopPropagation();
    const clickedLayer = getEventLayer(e, map);
    onEventClick(clickedLayer);
  });

  useEffect(() => {
    !!events && addFeatureCollectionImagesToMap(events, map);
    addClusterIconToMap();
    map.on('click', EVENT_SYMBOLS, handleEventClick.current);
    return () => {
      map.off('click', EVENT_SYMBOLS, handleEventClick.current); // eslint-disable-line
    };
  }, [events, map]);

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

    {!enableClustering && <Layer sourceId='events-data-unclustered' id={EVENT_SYMBOLS} type='symbol'
      paint={eventSymbolLayerPaint}
      layout={eventSymbolLayerLayout} {...rest} />}

    {enableClustering && <Layer after={SUBJECT_SYMBOLS} sourceId='events-data-clustered' id={EVENT_SYMBOLS} type='symbol'
      filter={['!has', 'point_count']}
      paint={eventSymbolLayerPaint}
      layout={eventSymbolLayerLayout} {...rest} />}


    {enableClustering && <Layer after={SUBJECT_SYMBOLS} sourceId='events-data-clustered' id={EVENT_CLUSTERS_CIRCLES} type='symbol'
      filter={['has', 'point_count']} onClick={onClusterClick} layout={clusterSymbolLayout} paint={clusterSymbolPaint} />}
  </Fragment>;
};

export default withMapNames(withMap(memo(EventsLayer)));

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