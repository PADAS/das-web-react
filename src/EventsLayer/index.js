import React, { Fragment, memo, useEffect, useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';
import debounceRender from 'react-debounce-render';
import concave from '@turf/concave';
import buffer from '@turf/buffer';
import simplify from '@turf/simplify';
import { featureCollection } from '@turf/helpers';

import { addFeatureCollectionImagesToMap, addMapImage } from '../utils/map';
import { calcUrlForImage } from '../utils/img';

import { withMap } from '../EarthRangerMap';
import withMapNames from '../WithMapNames';
import ClusterIcon from '../common/images/icons/cluster-icon.svg';

import LabeledSymbolLayer from '../LabeledSymbolLayer';

import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT, MAP_ICON_SCALE, MAX_ZOOM } from '../constants';

const { EVENT_CLUSTERS_CIRCLES, SUBJECT_SYMBOLS, EVENT_SYMBOLS } = LAYER_IDS;

const UNCLUSTERED_EVENT_SYMBOLS = `${EVENT_SYMBOLS}_UNCLUSTERED`;

const clusterSymbolLayout = {
  'icon-image': 'event-cluster-icon',
  'icon-size': [
    'interpolate', ['exponential', 0.5], ['zoom'],
    7, 0.5,
    12, 0.85/MAP_ICON_SCALE,
    MAX_ZOOM, 1.1/MAP_ICON_SCALE,
  ],
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

const eventLabelPaint = {
  'text-halo-color': ['case',
    ['has', 'distanceFromVirtualDate'],
    ['interpolate', ['linear'], ['abs', ['get', 'distanceFromVirtualDate']], 0, 'rgba(255, 255, 126, 1)', .225, 'rgba(255,255,255,0.7)'],
    'rgba(255,255,255,0.7)',
  ],
};

const clusterPolyPaint = {
  'fill-color': 'rgba(60, 120, 40, 0.4)',
  'fill-outline-color': 'rgba(20, 100, 25, 1)',
};



const EventsLayer = (props) => {
  const { events, onEventClick, onClusterClick, enableClustering, map, mapImages = {}, mapNameLayout, ...rest } = props;

  const handleClusterClick = (e) => {
    setClusterBufferPolygon(featureCollection([]));
    onClusterClick(e);
  };

  const [mapEventFeatureCollection, setMapEventFeatureCollection] = useState(featureCollection([]));
  const [clusterBufferPolygon, setClusterBufferPolygon] = useState(featureCollection([]));
  const [eventSymbolLayerIDs, setEventSymbolLayerIDs] = useState([]);
  const clicking = useRef(false);


  useEffect(() => {
    setMapEventFeatureCollection({
      ...events,
      features: events.features.filter((feature) => {
        return !!mapImages[
          calcUrlForImage(
            feature.properties.image || feature.properties.image_url
          )
        ];
      }),
    });
  }, [events, mapImages]);

  const getEventLayer = useCallback((e, map) => map.queryRenderedFeatures(e.point, { layers: eventSymbolLayerIDs })[0], [eventSymbolLayerIDs]);

  const handleEventClick = useCallback((e) => {
    if (!clicking.current) {
      clicking.current = true;
      const clickedLayer = getEventLayer(e, map);
      onEventClick(clickedLayer);
      setTimeout(() => {
        clicking.current = false;
      });
    }
  }, [getEventLayer, map, onEventClick]);

  useEffect(() => {
    const addClusterIconToMap = async () => {
      if (!map.hasImage('event-cluster-icon')) {
        addMapImage(ClusterIcon, 'event-cluster-icon');
      }
    };
    !!events && addFeatureCollectionImagesToMap(events, map);
    addClusterIconToMap();
  }, [eventSymbolLayerIDs, events, handleEventClick, map]);

  const clusterGeometryIsSet = !!clusterBufferPolygon
    && !!clusterBufferPolygon.geometry
    && !!clusterBufferPolygon.geometry.coordinates
    && !!clusterBufferPolygon.geometry.coordinates.length;

  const onClusterMouseEnter = (e) => {
    if (!clusterGeometryIsSet) {
      const clusterID = map.queryRenderedFeatures(e.point, { layers: [EVENT_CLUSTERS_CIRCLES] })[0].id;
      if (clusterID) {
        const clusterSource = map.getSource('events-data-clustered');
        clusterSource.getClusterLeaves(clusterID, 999, 0, (_err, results = []) => {
          if (results && results.length > 2) {
            try {
              const concaved = concave(featureCollection(results));
              
              if (!concaved) return;
              
              const buffered = buffer(concaved, 0.2);
              const simplified = simplify(buffered, { tolerance: 0.005 });
              // const tenPixelBufferSize = metersPerPixel(lat, zoom) / 100;
              
              setClusterBufferPolygon(simplified);
            } catch (e) {
              /* there are plenty of reasons a feature collection, coerced through this chain of transformations, may error. it may make an illegal shape, create a
              non-closed/invalid LinearRing, etc etc. try/catch is a bad choice most of the time but it fits the bill for error swallowing here. */
            }
          }
        });
      } else {
        setClusterBufferPolygon(featureCollection([]));
      }
    }
  };
  
  const onClusterMouseLeave = () => {
    // console.log('mouse leave, should be clearing the polygon');
    setClusterBufferPolygon(featureCollection([]));
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

  const eventIconLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    ...eventClusterDisabledLayout,
    'text-size': 0,
  };

  const eventLabelLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    ...eventClusterDisabledLayout,
    'text-field': '{display_title}',
    ...mapNameLayout,
  };

  const clusterConfig = {
    cluster: true,
    clusterMaxZoom: 17, // Max zoom to cluster points on
    clusterRadius: 50,
  };

  const sourceData = {
    type: 'geojson',
    data: mapEventFeatureCollection,
  };

  const clusteredSourceData = {
    ...sourceData,
    ...clusterConfig,
  };

  const clusterBufferData = {
    type: 'geojson',
    data: clusterBufferPolygon,
  };

  return <Fragment>
    <Source id='events-data-clustered' geoJsonSource={clusteredSourceData} />
    <Source id='events-data-unclustered' geoJsonSource={sourceData} />
    <Source id='cluster-buffer-polygon-data' geoJsonSource={clusterBufferData} />

    {!enableClustering && <LabeledSymbolLayer layout={eventIconLayout} textLayout={eventLabelLayout} textPaint={eventLabelPaint} minZoom={7} before={SUBJECT_SYMBOLS} sourceId='events-data-unclustered' type='symbol'
      id={EVENT_SYMBOLS} onClick={handleEventClick}
      onInit={setEventSymbolLayerIDs}
    />}

    {enableClustering && <Fragment>
      <LabeledSymbolLayer layout={eventIconLayout} textLayout={eventLabelLayout} textPaint={eventLabelPaint} minZoom={7} before={SUBJECT_SYMBOLS} sourceId='events-data-clustered' type='symbol'
        id={EVENT_SYMBOLS} filter={['!has', 'point_count']} onClick={handleEventClick}
        onInit={setEventSymbolLayerIDs}
      />

      <Layer minZoom={7} after={SUBJECT_SYMBOLS} sourceId='events-data-clustered' id={EVENT_CLUSTERS_CIRCLES} type='symbol'
        filter={['has', 'point_count']} onClick={handleClusterClick} layout={{...clusterSymbolLayout, 'visibility': enableClustering ? 'visible' : 'none'}} paint={clusterSymbolPaint}
        onMouseEnter={onClusterMouseEnter} onMouseLeave={onClusterMouseLeave} />

      <Layer minZoom={7} before={EVENT_CLUSTERS_CIRCLES} sourceId='cluster-buffer-polygon-data' id='cluster-polygon' type='fill' paint={clusterPolyPaint} />
    </Fragment>}
  </Fragment>;
};

export default debounceRender(memo(withMapNames(withMap(EventsLayer))), 16.6666); /* debounce updates a bit without throttlling below 60fps */

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