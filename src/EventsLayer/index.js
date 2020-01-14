import React, { Fragment, memo, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer, GeoJSONLayer } from 'react-mapbox-gl';
import concave from '@turf/concave';
import buffer from '@turf/buffer';
import simplify from '@turf/simplify';
import { featureCollection } from '@turf/helpers';

import { addFeatureCollectionImagesToMap, addMapImage, metersPerPixel } from '../utils/map';
import { addBounceToEventMapFeatures } from '../utils/events';

import { withMap } from '../EarthRangerMap';
import withMapNames from '../WithMapNames';
import ClusterIcon from '../common/images/icons/cluster-icon.svg';

import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT, IF_SYMBOL_ICON_IS_GENERIC, MAX_ZOOM } from '../constants';

const { EVENT_CLUSTERS_CIRCLES, SUBJECT_SYMBOLS, EVENT_SYMBOLS } = LAYER_IDS;

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

const clusterPolyPaint = {
  'fill-color': 'rgba(60, 120, 40, 0.4)',
  'fill-outline-color': 'rgba(20, 100, 25, 1)',
};

// 'bounce animation'
const framesPerSecond = 20;
const MAX_BOUNCE_SIZE = 2;
const fontScaleCompensation = 2;

const getEventLayer = (e, map) => map.queryRenderedFeatures(e.point, { layers: [LAYER_IDS.EVENT_SYMBOLS] })[0];

const EventsLayer = (props) => {
  const { events, onEventClick, onClusterClick, enableClustering, map, mapNameLayout, bounceEventID, ...rest } = props;

  // assign IDs and 'bounce' property to the current event feature collection,
  // so that we can disable feature state after it is animated. 
  // XXX Need to do this in a selector, and also see why there are so many frame refreshes
  if (events && events.features) {
    const featuresWithIds = addBounceToEventMapFeatures(events.features, bounceEventID);
    events.features = featuresWithIds;
  }

  const handleClusterClick = (e) => {
    setClusterBufferPolygon(featureCollection([]));
    onClusterClick(e);
  };

  const [clusterBufferPolygon, setClusterBufferPolygon] = useState(featureCollection([]));
  const timeoutRef = useRef(null);

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
    window.clearTimeout(timeoutRef.current);
    // console.log('mouse leave, should be clearing the polygon');
    setClusterBufferPolygon(featureCollection([]));
  };

  const handleEventClick = useRef((e) => {
    e.preventDefault();
    e.originalEvent.stopPropagation();
    const clickedLayer = getEventLayer(e, map);
    onEventClick(clickedLayer);
  });

  useEffect(() => {
    const addClusterIconToMap = async () => {
      if (!map.hasImage('event-cluster-icon')) {
        addMapImage(ClusterIcon, 'event-cluster-icon');
      }
    };
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

  const [currentBounceScalingValue, setcurrentBounceScalingValue] = useState(1);
  const animationFrameID = useRef(null);

  const updateBounce = (currentVal) => {
    setTimeout(() => {
      const updatedValue = currentVal+0.1;
      if (updatedValue > MAX_BOUNCE_SIZE) {
        setcurrentBounceScalingValue(1);
      } else {
        setcurrentBounceScalingValue(updatedValue);
      }
    }, 1000 / framesPerSecond);
  };

  const bounceAnimation = useRef(updateBounce);

  useEffect(() => {
    animationFrameID.current = window.requestAnimationFrame(() => bounceAnimation.current(currentBounceScalingValue));
    return () => {
      !!animationFrameID && !!animationFrameID.current && window.cancelAnimationFrame(animationFrameID.current);
    };
  }, [currentBounceScalingValue]);

  // text-size and icon-size are grouped as layout properties 
  // but in fact are interpolated between integer zoom levels
  const defaultEventSymbolIconSize = DEFAULT_SYMBOL_LAYOUT['icon-size'];
  const defaultEventSymbolTextSize = DEFAULT_SYMBOL_LAYOUT['text-size'];
  const bounceEventSymbolIconSize = [
    'interpolate', ['exponential', 0.5], ['zoom'],
    7, 0,
    12, IF_SYMBOL_ICON_IS_GENERIC(0.5  * currentBounceScalingValue, 1  * currentBounceScalingValue),
    MAX_ZOOM, IF_SYMBOL_ICON_IS_GENERIC(0.75 * currentBounceScalingValue, 1.5 * currentBounceScalingValue),
  ];
  const bounceEventSymbolTextSize = [
    'interpolate', ['exponential', 0.5], ['zoom'],
    6, 0,
    12, IF_SYMBOL_ICON_IS_GENERIC(12 + 0.5  * currentBounceScalingValue, 12 + 1  * currentBounceScalingValue),
    MAX_ZOOM, IF_SYMBOL_ICON_IS_GENERIC(12 + 0.75 * currentBounceScalingValue * fontScaleCompensation, 12 + 1.5 * currentBounceScalingValue * fontScaleCompensation),
  ];

  const eventSymbolLayerLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    'text-field': '{display_title}',
    ...mapNameLayout,
    ...eventClusterDisabledLayout,
    'icon-size': [
      'match',
      ['get', 'bounce'],
      'true',
      bounceEventSymbolIconSize,
      'false',
      defaultEventSymbolIconSize,
      defaultEventSymbolIconSize // when its neither true nor false
    ],
    'text-size': defaultEventSymbolTextSize,
  };

  const clusterConfig = {
    cluster: true,
    clusterMaxZoom: 17, // Max zoom to cluster points on
    clusterRadius: 70,
  };

  const sourceData = {
    type: 'geojson',
    data: events,
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
    

    {!enableClustering && <Layer sourceId='events-data-unclustered' id={EVENT_SYMBOLS} type='symbol'
      paint={eventSymbolLayerPaint}
      layout={eventSymbolLayerLayout} {...rest} />}

    {enableClustering && <Fragment>
      <Layer after={SUBJECT_SYMBOLS} sourceId='events-data-clustered' id={EVENT_SYMBOLS} type='symbol'
        filter={['!has', 'point_count']}
        paint={eventSymbolLayerPaint}
        layout={eventSymbolLayerLayout} {...rest} />

      <Layer after={SUBJECT_SYMBOLS} sourceId='events-data-clustered' id={EVENT_CLUSTERS_CIRCLES} type='symbol'
        filter={['has', 'point_count']} onClick={handleClusterClick} layout={clusterSymbolLayout} paint={clusterSymbolPaint}
        onMouseEnter={onClusterMouseEnter} onMouseLeave={onClusterMouseLeave}
      />

      <Layer before={EVENT_CLUSTERS_CIRCLES} sourceId='cluster-buffer-polygon-data' id='cluster-polygon' type='fill' paint={clusterPolyPaint} />
    </Fragment>}
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