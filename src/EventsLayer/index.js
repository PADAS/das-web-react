import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';
import debounceRender from 'react-debounce-render';
import { featureCollection } from '@turf/helpers';
import { useSelector } from 'react-redux';

import { addMapImage } from '../utils/map';

import LabeledSymbolLayer from '../LabeledSymbolLayer';
import { withMap } from '../EarthRangerMap';
import withMapViewConfig from '../WithMapViewConfig';
import ClusterIcon from '../common/images/icons/cluster-icon.svg';

import { addBounceToEventMapFeatures } from '../utils/events';
import {
  DEFAULT_SYMBOL_LAYOUT,
  IF_IS_GENERIC,
  LAYER_IDS,
  MAX_ZOOM,
  DEFAULT_SYMBOL_PAINT,
  MAP_ICON_SCALE,
  REACT_APP_ENABLE_CLUSTERING,
  SYMBOL_TEXT_SIZE_EXPRESSION,
} from '../constants';
import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';
import MapImageFromSvgSpriteRenderer, { calcSvgImageIconId } from '../MapImageFromSvgSpriteRenderer';
import { getShouldEventsBeClustered, getShowReportsOnMap } from '../selectors/clusters';
import useClusterBufferPolygon from '../hooks/useClusterBufferPolygon';

const {
  CLUSTER_BUFFER_POLYGON_LAYER_ID,
  CLUSTERS_SOURCE_ID,
  EVENT_CLUSTERS_CIRCLES,
  EVENT_SYMBOLS,
  SUBJECT_SYMBOLS,
} = LAYER_IDS;

const ANIMATION_LENGTH_SECONDS = .25;
const FRAMES_PER_SECOND = 6;
const ANIMATION_INTERVAL = Math.PI / (FRAMES_PER_SECOND * ANIMATION_LENGTH_SECONDS);
const ICON_SCALE_RATE = .15;
const FONT_SCALE_RATE = 1.75;

const EVENTS_LAYER_TEXT_PAINT = {
  'icon-color': [
    'case',
    ['has', 'distanceFromVirtualDate'],
    [
      'interpolate',
      ['linear'],
      ['abs', ['get', 'distanceFromVirtualDate']],
      0,
      'rgba(255, 255, 126, 1)',
      .3,
      'rgba(255,255,255,0.7)',
    ],
    'rgba(255,255,255,0.7)',
  ],
};

export const CLUSTER_CONFIG = {
  cluster: true,
  clusterMaxZoom: MAX_ZOOM - 1,
  clusterRadius: 40,
};

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

const EventsLayer = ({
  bounceEventIDs,
  enableClustering, // Old events-only-clustering implementation
  map,
  mapImages,
  mapUserLayoutConfigByLayerId,
  minZoom,
  onClusterClick,
  onEventClick,
}) => {
  const eventFeatureCollection = useSelector(getMapEventFeatureCollectionWithVirtualDate);
  const showReportsOnMap = useSelector(getShowReportsOnMap);
  const shouldEventsBeClustered = useSelector(getShouldEventsBeClustered);

  const animationFrameID = useRef(null);
  const clicking = useRef(false);

  const [animationState, setAnimationState] = useState({ frame: 1, scale: 0.0, isRendering: false });
  const [bounceIDs, setBounceIDs] = useState([]);
  const [eventLayerIds, setEventLayerIds] = useState([]);
  const [eventsWithBounce, setEventsWithBounce] = useState(featureCollection([]));
  const [mapEventFeatures, setMapEventFeatures] = useState(featureCollection([]));

  useEffect(() => {
    setEventsWithBounce({
      ...eventFeatureCollection,
      features: addBounceToEventMapFeatures(eventFeatureCollection.features, bounceEventIDs),
    });
  }, [bounceEventIDs, eventFeatureCollection]);

  useEffect(() => {
    setBounceIDs(bounceEventIDs);
    setAnimationState({ frame: 1, isRendering: (bounceEventIDs.length > 0), scale: 0.0 });
  }, [bounceEventIDs]);

  useEffect(() => {
    setMapEventFeatures({
      ...eventsWithBounce,
      features: eventsWithBounce.features.filter(feature => !map.hasImage(calcSvgImageIconId(feature))),
    });
  }, [eventsWithBounce, map, mapImages]);

  const onEventSymbolClick = useCallback((event) => {
    if (!clicking.current) {
      clicking.current = true;

      const clickedLayer = map.queryRenderedFeatures(event.point, { layers: eventLayerIds })[0];
      onEventClick({ event, layer: clickedLayer });

      setTimeout(() => {
        clicking.current = false;
      });
    }
  }, [eventLayerIds, map, onEventClick]);

  const updateBounceSineAnimation = useCallback(() => {
    let currFrame = animationState.frame;
    const updatedScale = Math.sin(ANIMATION_INTERVAL * currFrame);
    if (bounceIDs.length) {
      // assumes first increment of animation curve val> 0
      if (Math.abs(updatedScale) > 1e-8) {
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
  }, [animationState.isRendering, bounceIDs.length, updateBounceSineAnimation]);

  const SCALE_ICON_IF_BOUNCED = useCallback((iconSize, iconScale) => [
    'match',
    ['get', 'bounce'],
    'true',
    iconSize + animationState.scale * iconScale,
    iconSize,
  ], [animationState.scale]);

  const eventIconLayout = useMemo(() => ({
    ...DEFAULT_SYMBOL_LAYOUT,
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
    'icon-size': [
      'interpolate', ['exponential', 0.5], ['zoom'],
      0, IF_IS_GENERIC(
        SCALE_ICON_IF_BOUNCED(0.125 / MAP_ICON_SCALE, ICON_SCALE_RATE),
        SCALE_ICON_IF_BOUNCED(0.25 / MAP_ICON_SCALE, ICON_SCALE_RATE)),
      12, IF_IS_GENERIC(
        SCALE_ICON_IF_BOUNCED(0.5 / MAP_ICON_SCALE, ICON_SCALE_RATE),
        SCALE_ICON_IF_BOUNCED(1 / MAP_ICON_SCALE, ICON_SCALE_RATE)),
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
        ['concat',
          '-',
          ['get', 'height'],
        ],
        ''],
    ],
    ...mapUserLayoutConfigByLayerId(EVENT_SYMBOLS),
    'text-size': 0,
  }), [SCALE_ICON_IF_BOUNCED, mapUserLayoutConfigByLayerId]);

  const SCALE_FONT_IF_BOUNCED = useCallback((fontSize, fontScale) => [
    'match',
    ['get', 'bounce'],
    'true',
    fontSize + animationState.scale * fontScale,
    fontSize,
  ], [animationState.scale]);
  const eventLabelLayout = useMemo(() => ({
    ...DEFAULT_SYMBOL_LAYOUT,
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
    'text-field': '{display_title}',
    'text-size': [
      'interpolate', ['exponential', 0.5], ['zoom'],
      0, 5,
      6, SCALE_FONT_IF_BOUNCED(8, FONT_SCALE_RATE),
      14, SCALE_FONT_IF_BOUNCED(13, FONT_SCALE_RATE),
    ],
    ...mapUserLayoutConfigByLayerId(EVENT_SYMBOLS),
  }), [SCALE_FONT_IF_BOUNCED, mapUserLayoutConfigByLayerId]);

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
    data: {
      ...mapEventFeatures,
      features: !shouldEventsBeClustered && !!showReportsOnMap ? mapEventFeatures.features : [],
    },
  };

  const isSubjectSymbolsLayerReady = !!map.getLayer(SUBJECT_SYMBOLS);

  return <>
    <Source id='events-data-unclustered' geoJsonSource={sourceData} />

    {!REACT_APP_ENABLE_CLUSTERING && <>
      <Source id='events-data-clustered' geoJsonSource={{ ...sourceData, ...CLUSTER_CONFIG }} />

      {enableClustering && isSubjectSymbolsLayerReady && <>
        <Layer minZoom={minZoom} after={SUBJECT_SYMBOLS} sourceId='events-data-clustered' id={EVENT_CLUSTERS_CIRCLES} type='symbol'
          filter={['has', 'point_count']} onClick={handleClusterClick} layout={{ ...clusterSymbolLayout, 'visibility': enableClustering ? 'visible' : 'none' }} paint={clusterSymbolPaint}
          onMouseEnter={onClusterMouseEnter} onMouseLeave={removeClusterPolygon} />
      </>}
    </>}

    {isSubjectSymbolsLayerReady && <>
      <LabeledSymbolLayer
        before={SUBJECT_SYMBOLS}
        filter={['all', ['has', 'event_type'], ['!has', 'point_count']]}
        id={`${EVENT_SYMBOLS}-unclustered`}
        layout={eventIconLayout}
        minZoom={minZoom}
        onClick={onEventSymbolClick}
        onInit={REACT_APP_ENABLE_CLUSTERING ? () => setEventLayerIds([
          EVENT_SYMBOLS,
          `${EVENT_SYMBOLS}-labels`,
          `${EVENT_SYMBOLS}-unclustered`,
          `${EVENT_SYMBOLS}-unclustered-labels`,
        ]) : setEventLayerIds}
        sourceId={!REACT_APP_ENABLE_CLUSTERING && enableClustering ? 'events-data-clustered' : 'events-data-unclustered'}
        textLayout={eventLabelLayout}
        textPaint={EVENTS_LAYER_TEXT_PAINT}
        type="symbol"
      />

      {REACT_APP_ENABLE_CLUSTERING && !!map.getSource(CLUSTERS_SOURCE_ID) && <>
        <LabeledSymbolLayer
          before={SUBJECT_SYMBOLS}
          filter={['all', ['has', 'event_type'], ['!has', 'point_count']]}
          id={EVENT_SYMBOLS}
          layout={eventIconLayout}
          minZoom={minZoom}
          onClick={onEventSymbolClick}
          sourceId={CLUSTERS_SOURCE_ID}
          textLayout={eventLabelLayout}
          textPaint={EVENTS_LAYER_TEXT_PAINT}
          type="symbol"
        />
      </>}
    </>}

    {!!eventFeatureCollection?.features?.length && <MapImageFromSvgSpriteRenderer
      reportFeatureCollection={eventFeatureCollection}
    />}
  </>;
};

EventsLayer.defaultProps = {
  bounceEventIDs: [],
  enableClustering: true, // Old events-only-clustering implementation
  mapImages: {},
  onClusterClick: () => {},
  onEventClick: () => {},
};

EventsLayer.propTypes = {
  bounceEventIDs: PropTypes.string,
  enableClustering: PropTypes.bool, // Old events-only-clustering implementation
  map: PropTypes.object.isRequired,
  mapImages: PropTypes.object,
  mapUserLayoutConfigByLayerId: PropTypes.func,
  minZoom: PropTypes.number,
  onClusterClick: PropTypes.func,
  onEventClick: PropTypes.func.isRequired,
};

export default debounceRender(memo(withMapViewConfig(withMap(EventsLayer))), 16.6666); /* debounce updates a bit without throttlling below 60fps */
