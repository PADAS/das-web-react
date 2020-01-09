import React, { Fragment, memo, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer, GeoJSONLayer } from 'react-mapbox-gl';
import concave from '@turf/concave';
import buffer from '@turf/buffer';
import simplify from '@turf/simplify';
import { featureCollection } from '@turf/helpers';

import { addFeatureCollectionImagesToMap, addMapImage, metersPerPixel } from '../utils/map';

import { withMap } from '../EarthRangerMap';
import withMapNames from '../WithMapNames';
import ClusterIcon from '../common/images/icons/cluster-icon.svg';

import { LAYER_IDS, DEFAULT_SYMBOL_LAYOUT, DEFAULT_SYMBOL_PAINT } from '../constants';

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

// todo - grab this from defaults
const initialIconSize = 12;
const framesPerSecond = 20;
const maxSize = 24;
const animationLength = framesPerSecond * 2;
// oscillate using a sin function
const animationInterval = Math.PI / animationLength;

const getEventLayer = (e, map) => map.queryRenderedFeatures(e.point, { layers: [LAYER_IDS.EVENT_SYMBOLS] })[0];

const EventsLayer = (props) => {
  const { events, onEventClick, onClusterClick, enableClustering, map, mapNameLayout, ...rest } = props;

  // bounce animation
  const animationFrameID = useRef(null);
  const [animationState, setAnimationState] = useState({
    currentFrame: 0,
  });

  const updateBounceAnimation = (animationState) => {
    let currFrame = animationState.currentFrame;
    if(animationLength >= currFrame) {
      setAnimationState({currentFrame: ++currFrame});
      const sizeDelta = Math.sin(animationInterval * currFrame);
      console.log('icon size', sizeDelta);
    }
  };

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
    const eventSymbol = map.queryRenderedFeatures({ layers: [EVENT_SYMBOLS] })[0];
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

  const eventSymbolLayerLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    'text-field': '{display_title}',
    ...mapNameLayout,
    ...eventClusterDisabledLayout,
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