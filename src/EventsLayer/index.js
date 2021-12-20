import React, { Fragment, memo, useEffect, useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';
import debounceRender from 'react-debounce-render';
import concave from '@turf/concave';
import buffer from '@turf/buffer';
import simplify from '@turf/simplify';
import { featureCollection } from '@turf/helpers';

import { addMapImage } from '../utils/map';
import { addBounceToEventMapFeatures } from '../utils/events';

import { withMap } from '../EarthRangerMap';
import withMapViewConfig from '../WithMapViewConfig';
import MapImageFromSvgSpriteRenderer, { calcSvgImageIconId } from '../MapImageFromSvgSpriteRenderer';
import ClusterIcon from '../common/images/icons/cluster-icon.svg';

import LabeledSymbolLayer from '../LabeledSymbolLayer';
import {
  CLUSTERS_MAX_ZOOM,
  CLUSTERS_RADIUS,
  FEATURE_FLAGS,
  LAYER_IDS,
  MAX_ZOOM,
  DEFAULT_SYMBOL_LAYOUT,
  DEFAULT_SYMBOL_PAINT,
  IF_IS_GENERIC,
  MAP_ICON_SCALE,
  SYMBOL_TEXT_SIZE_EXPRESSION,
} from '../constants';
import { useFeatureFlag } from '../hooks';

export const CLUSTER_CONFIG = {
  cluster: true,
  clusterMaxZoom: MAX_ZOOM - 1, // Max zoom to cluster points on
  clusterRadius: 40,
};

const { EVENT_CLUSTERS_CIRCLES, SUBJECT_SYMBOLS, EVENT_SYMBOLS } = LAYER_IDS;

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

const eventLabelPaint = {
  'icon-color': ['case',
    ['has', 'distanceFromVirtualDate'],
    ['interpolate', ['linear'], ['abs', ['get', 'distanceFromVirtualDate']], 0, 'rgba(255, 255, 126, 1)', .3, 'rgba(255,255,255,0.7)'],
    'rgba(255,255,255,0.7)',
  ],
};

const clusterPolyPaint = {
  'fill-color': 'rgba(60, 120, 40, 0.4)',
  'fill-outline-color': 'rgba(20, 100, 25, 1)',
};

// bounce animation constants
const FRAMES_PER_SECOND = 6;
const ANIMATION_LENGTH_SECONDS = .25; //seconds
const ANIMATION_INTERVAL = Math.PI/(FRAMES_PER_SECOND * ANIMATION_LENGTH_SECONDS);
// text-size interpolates at a different rate than icon-size for bounce animation
const ICON_SCALE_RATE = .15;
const FONT_SCALE_RATE = 1.75;

const EventsLayer = (props) => {
  const { events, onEventClick, onClusterClick, enableClustering, map, mapImages = {}, mapUserLayoutConfig, minZoom, bounceEventIDs = [] } = props;

  const clusteringFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.CLUSTERING);

  // assign 'bounce' property to the current event feature collection,
  // so that we can render bounce and disable feature state after it is animated. 
  const [eventsWithBounce, setEventsWithBounce] = useState(featureCollection([]));
  const [bounceIDs, setBounceIDs] = useState([]);

  const [animationState, setAnimationState] = useState({
    frame: 1,
    scale: 0.0,
    isRendering: false,
  });

  useEffect(() => {
    setEventsWithBounce({
      ...events,
      features: addBounceToEventMapFeatures(events.features, bounceEventIDs),
    });
  }, [bounceEventIDs, events]);

  useEffect(() => {
    setBounceIDs(bounceEventIDs);
    setAnimationState({ frame: 1, scale: 0.0, isRendering: (bounceEventIDs.length > 0) });
  }, [bounceEventIDs]);

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
      ...eventsWithBounce,
      features: eventsWithBounce.features.filter(feature =>
        !map.hasImage(
          calcSvgImageIconId(feature)
        )
      ),
    });
  }, [eventsWithBounce, map, mapImages]);

  const getEventLayer = useCallback((e, map) => map.queryRenderedFeatures(e.point, { layers: eventSymbolLayerIDs })[0], [eventSymbolLayerIDs]);

  const handleEventClick = useCallback((event) => {
    if (!clicking.current) {
      clicking.current = true;
      const clickedLayer = getEventLayer(event, map);
      onEventClick({ event, layer: clickedLayer });
      setTimeout(() => {
        clicking.current = false;
      });
    }
  }, [getEventLayer, map, onEventClick]);

  useEffect(() => {
    const addClusterIconToMap = () => {
      if (!map.hasImage('event-cluster-icon')) {
        addMapImage({ src: ClusterIcon, id: 'event-cluster-icon' });
      }
    };

    addClusterIconToMap();
  }, [map]);

  const clusterGeometryIsSet = !!clusterBufferPolygon
    && !!clusterBufferPolygon.geometry
    && !!clusterBufferPolygon.geometry.coordinates
    && !!clusterBufferPolygon.geometry.coordinates.length;

  const onClusterMouseEnter = useCallback((e) => {
    if (!clusterGeometryIsSet && map.getZoom() < CLUSTER_CONFIG.clusterMaxZoom) {
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
  }, [clusterGeometryIsSet, map]);

  const onClusterMouseLeave = useCallback(() => {
    setClusterBufferPolygon(featureCollection([]));
  }, []);

  const eventClusterDisabledLayout = enableClustering ? {} : {
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
  };

  const animationFrameID = useRef(null);

  const updateBounceSineAnimation = useCallback(() => {
    let currFrame = animationState.frame;
    const updatedScale = Math.sin(ANIMATION_INTERVAL * currFrame);
    if (bounceIDs.length) {
      // assumes first increment of animation curve val> 0
      if (Math.abs(updatedScale) > 1e-8)
      {
        setTimeout(() => {
          setAnimationState({ frame: ++currFrame, scale: 1.0 + updatedScale, isRendering: true });
        }, 1000 / FRAMES_PER_SECOND);
      } else {
        setBounceIDs([]);
        setAnimationState({ frame: 1, scale: 0.0, isRendering: false });
      }
    }
  }, [animationState.frame, bounceIDs.length]);

  useEffect(() => {
    if (bounceIDs.length && animationState.isRendering) {
      animationFrameID.current = window.requestAnimationFrame(() => updateBounceSineAnimation());
    } else if (animationFrameID.current) {
      window.cancelAnimationFrame(animationFrameID.current);
    }
    return () => {
      !!animationFrameID && !!animationFrameID.current && window.cancelAnimationFrame(animationFrameID.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounceIDs, animationState]);


  const SCALE_ICON_IF_BOUNCED = (iconSize, iconScale) => ['match', ['get', 'bounce'], 'true', iconSize + animationState.scale * iconScale, iconSize];
  const SCALE_FONT_IF_BOUNCED = (fontSize, fontScale) => ['match', ['get', 'bounce'], 'true', fontSize + animationState.scale * fontScale, fontSize];
  // the mapbox DSL doesn't allow interpolations or steps 
  // to be nested in their DSL, which results in this crazy layout

  const eventIconLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    ...eventClusterDisabledLayout,
    'icon-size': [
      'interpolate', ['exponential', 0.5], ['zoom'],
      0, IF_IS_GENERIC(
        SCALE_ICON_IF_BOUNCED(0.125/MAP_ICON_SCALE, ICON_SCALE_RATE),
        SCALE_ICON_IF_BOUNCED(0.25/MAP_ICON_SCALE, ICON_SCALE_RATE)),
      12, IF_IS_GENERIC(
        SCALE_ICON_IF_BOUNCED(0.5/MAP_ICON_SCALE, ICON_SCALE_RATE),
        SCALE_ICON_IF_BOUNCED(1/MAP_ICON_SCALE, ICON_SCALE_RATE)),
    ],
    'icon-image': ['concat',
      ['get', 'icon_id'],
      '-',
      ['get', 'priority'],
      ['case',
        ['has', 'width'], [
          'concat',
          '-',
          ['get', 'width'],
        ],
        ''],
      ['case',
        ['has', 'height'],
        [ 'concat',
          '-',
          ['get', 'height'],
        ],
        ''],
    ],
    ...mapUserLayoutConfig,
    'text-size': 0,
  };

  const eventLabelLayout = {
    ...DEFAULT_SYMBOL_LAYOUT,
    ...eventClusterDisabledLayout,
    'text-field': '{display_title}',
    'text-size': [
      'interpolate', ['exponential', 0.5], ['zoom'],
      0, 5,
      6, SCALE_FONT_IF_BOUNCED(8, FONT_SCALE_RATE),
      14, SCALE_FONT_IF_BOUNCED(13, FONT_SCALE_RATE),
    ],
    ...mapUserLayoutConfig,
  };

  const sourceData = {
    type: 'geojson',
    data: mapEventFeatureCollection,
    ...(clusteringFeatureFlagEnabled ?
      {
        cluster: true,
        clusterMaxZoom: CLUSTERS_MAX_ZOOM,
        clusterRadius: CLUSTERS_RADIUS,
      }:
      {}
    ),
  };

  const clusteredSourceData = {
    ...sourceData,
    ...CLUSTER_CONFIG,
  };

  const clusterBufferData = {
    type: 'geojson',
    data: clusterBufferPolygon,
  };

  return <Fragment>
    {!clusteringFeatureFlagEnabled && <Source id='events-data-clustered' geoJsonSource={clusteredSourceData} />}
    <Source id='events-data-unclustered' geoJsonSource={sourceData} />
    {!clusteringFeatureFlagEnabled && <Source id='cluster-buffer-polygon-data' geoJsonSource={clusterBufferData} />}

    <LabeledSymbolLayer layout={eventIconLayout} textLayout={eventLabelLayout} textPaint={eventLabelPaint} minZoom={minZoom} before={SUBJECT_SYMBOLS} sourceId='events-data-unclustered' type='symbol'
      id={EVENT_SYMBOLS} onClick={handleEventClick}
      onInit={setEventSymbolLayerIDs}
      {...(clusteringFeatureFlagEnabled ? { filter: ['!has', 'point_count'] } : {})}
    />

    {!clusteringFeatureFlagEnabled && enableClustering && <Fragment>
      <LabeledSymbolLayer layout={eventIconLayout} textLayout={eventLabelLayout} textPaint={eventLabelPaint} minZoom={minZoom} before={SUBJECT_SYMBOLS} sourceId='events-data-clustered' type='symbol'
        id={EVENT_SYMBOLS} filter={['!has', 'point_count']} onClick={handleEventClick}
        onInit={setEventSymbolLayerIDs}
      />

      <Layer minZoom={minZoom} after={SUBJECT_SYMBOLS} sourceId='events-data-clustered' id={EVENT_CLUSTERS_CIRCLES} type='symbol'
        filter={['has', 'point_count']} onClick={handleClusterClick} layout={{ ...clusterSymbolLayout, 'visibility': enableClustering ? 'visible' : 'none' }} paint={clusterSymbolPaint}
        onMouseEnter={onClusterMouseEnter} onMouseLeave={onClusterMouseLeave} />

      <Layer minZoom={minZoom} maxZoom={MAX_ZOOM - 2} before={EVENT_CLUSTERS_CIRCLES} sourceId='cluster-buffer-polygon-data' id='cluster-polygon' type='fill' paint={clusterPolyPaint} />
    </Fragment>}
    {!!events?.features?.length && <MapImageFromSvgSpriteRenderer reportFeatureCollection={events} />}
  </Fragment>;
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
