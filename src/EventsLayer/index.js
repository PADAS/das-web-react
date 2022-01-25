import React, { memo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';
import debounceRender from 'react-debounce-render';
import { featureCollection } from '@turf/helpers';

import { addMapImage } from '../utils/map';
import useEventsLayer from '../hooks/useEventsLayer';

import { withMap } from '../EarthRangerMap';
import withMapViewConfig from '../WithMapViewConfig';
import ClusterIcon from '../common/images/icons/cluster-icon.svg';

import {
  LAYER_IDS,
  MAX_ZOOM,
  DEFAULT_SYMBOL_PAINT,
  MAP_ICON_SCALE,
  SYMBOL_TEXT_SIZE_EXPRESSION,
} from '../constants';
import useClusterBufferPolygon from '../hooks/useClusterBufferPolygon';

export const CLUSTER_CONFIG = {
  cluster: true,
  clusterMaxZoom: MAX_ZOOM - 1, // Max zoom to cluster points on
  clusterRadius: 40,
};

const { CLUSTER_BUFFER_POLYGON_LAYER_ID, EVENT_CLUSTERS_CIRCLES, SUBJECT_SYMBOLS } = LAYER_IDS;

const clusterSymbolLayout = {
  'icon-image': 'event-cluster-icon',
  'icon-size': [
    'interpolate', ['exponential', 0.5], ['zoom'],
    0, 0.25/MAP_ICON_SCALE,
    12, 0.85/MAP_ICON_SCALE,
    MAX_ZOOM, 1.1/MAP_ICON_SCALE,
  ],
  'icon-allow-overlap': true,
  'icon-pitch-alignment': 'map',
  'text-allow-overlap': true,
  'text-field': '{point_count_abbreviated}',
  'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
  'text-size': SYMBOL_TEXT_SIZE_EXPRESSION,
  'text-offset': [-0.8, -0.8],
};

const clusterSymbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
  'text-halo-color': 'rgba(255,255,255,1)',
  'text-halo-width': 3,
};

const clusterPolyPaint = {
  'fill-color': 'rgba(60, 120, 40, 0.4)',
  'fill-outline-color': 'rgba(20, 100, 25, 1)',
};

const CLUSTER_BUFFER_POLYGON_LAYER_CONFIGURATION = {
  before: EVENT_CLUSTERS_CIRCLES,
  id: CLUSTER_BUFFER_POLYGON_LAYER_ID,
  maxZoom: MAX_ZOOM - 2,
  paint: clusterPolyPaint,
  source: 'cluster-buffer-polygon-data',
  type: 'fill',
};
const CLUSTER_BUFFER_POLYGON_SOURCE_CONFIGURATION = { type: 'geojson' };

const EventsLayer = (props) => {
  const { onEventClick, onClusterClick, enableClustering, map, mapImages = {}, mapUserLayoutConfig, minZoom, bounceEventIDs = [] } = props;

  const {
    mapEventFeatures,
    renderedEventsLayer,
  } = useEventsLayer(bounceEventIDs, enableClustering, mapUserLayoutConfig, mapImages, minZoom, onEventClick);

  const { removeClusterPolygon, renderClusterPolygon, setClusterBufferPolygon } = useClusterBufferPolygon(
    { ...CLUSTER_BUFFER_POLYGON_LAYER_CONFIGURATION, minZoom },
    CLUSTER_BUFFER_POLYGON_LAYER_ID,
    CLUSTER_BUFFER_POLYGON_SOURCE_CONFIGURATION,
    'cluster-buffer-polygon-data'
  );

  const handleClusterClick = (e) => {
    setClusterBufferPolygon(featureCollection([]));
    onClusterClick(e);
  };

  useEffect(() => {
    const addClusterIconToMap = () => {
      if (!map.hasImage('event-cluster-icon')) {
        addMapImage({ src: ClusterIcon, id: 'event-cluster-icon' });
      }
    };

    addClusterIconToMap();
  }, [map]);

  const onClusterMouseEnter = useCallback((e) => {
    const clusterID = map.queryRenderedFeatures(e.point, { layers: [EVENT_CLUSTERS_CIRCLES] })[0].id;
    if (clusterID) {
      const clusterSource = map.getSource('events-data-clustered');
      clusterSource.getClusterLeaves(clusterID, 999, 0, (_err, results = []) => {
        renderClusterPolygon(featureCollection(results));
      });
    }
  }, [map, renderClusterPolygon]);

  const sourceData = {
    type: 'geojson',
    data: mapEventFeatures,
  };

  const clusteredSourceData = {
    ...sourceData,
    ...CLUSTER_CONFIG,
  };

  return <>
    <Source id='events-data-clustered' geoJsonSource={clusteredSourceData} />
    <Source id='events-data-unclustered' geoJsonSource={sourceData} />

    {renderedEventsLayer}

    {enableClustering && <>
      <Layer minZoom={minZoom} after={SUBJECT_SYMBOLS} sourceId='events-data-clustered' id={EVENT_CLUSTERS_CIRCLES} type='symbol'
        filter={['has', 'point_count']} onClick={handleClusterClick} layout={{ ...clusterSymbolLayout, 'visibility': enableClustering ? 'visible' : 'none' }} paint={clusterSymbolPaint}
        onMouseEnter={onClusterMouseEnter} onMouseLeave={removeClusterPolygon} />
    </>}
  </>;
};

export default debounceRender(memo(withMapViewConfig(withMap(EventsLayer))), 16.6666); /* debounce updates a bit without throttlling below 60fps */

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
  mapImages: PropTypes.object,
  onEventClick: PropTypes.func,
  onClusterClick: PropTypes.func,
  enableClustering: PropTypes.bool,
};
