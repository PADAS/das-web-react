import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { featureCollection } from '@turf/helpers';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import ClusterIcon from '../common/images/icons/cluster-icon.svg';

import { addBounceToEventMapFeatures } from '../utils/events';
import { addMapImage } from '../utils/map';
import {
  DEFAULT_SYMBOL_LAYOUT,
  IF_IS_GENERIC,
  LAYER_IDS,
  MAP_ICON_SCALE,
  MAX_ZOOM,
  SOURCE_IDS,
} from '../constants';
import { getMapEventSymbolPointsWithVirtualDate } from '../selectors/events';
import { getShouldEventsBeClustered, getShowReportsOnMap } from '../selectors/clusters';
import { MapContext } from '../App';
import MapImageFromSvgSpriteRenderer, { calcSvgImageIconId } from '../MapImageFromSvgSpriteRenderer';
import { useMapSource } from '../hooks';
import { withMultiLayerHandlerAwareness } from '../utils/map-handlers';

import EventGeometryLayer from '../EventGeometryLayer';
import LabeledSymbolLayer from '../LabeledSymbolLayer';
import withMapViewConfig from '../WithMapViewConfig';

const { EVENT_SYMBOLS, EVENT_GEOMETRY_LAYER, SUBJECT_SYMBOLS } = LAYER_IDS;

const { CLUSTERS_SOURCE_ID, UNCLUSTERED_EVENTS_SOURCE } = SOURCE_IDS;

const ANIMATION_LENGTH_SECONDS = .25;
const FRAMES_PER_SECOND = 6;
const ANIMATION_INTERVAL = Math.PI / (FRAMES_PER_SECOND * ANIMATION_LENGTH_SECONDS);

const FONT_SCALE_RATE = 1.75;
const ICON_SCALE_RATE = .15;

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

const SYMBOL_LAYER_FILTER = [
  'all',
  ['has', 'event_type'],
  ['==', ['has', 'point_count'], false],
  ['==', ['geometry-type'], 'Point'],
];

const EventsLayer = ({
  bounceEventIDs,
  mapImages,
  mapUserLayoutConfig,
  mapUserLayoutConfigByLayerId,
  minZoom,
  onEventClick,
}) => {
  const map = useContext(MapContext);

  const eventPointFeatureCollection = useSelector(getMapEventSymbolPointsWithVirtualDate);
  const shouldEventsBeClustered = useSelector(getShouldEventsBeClustered);
  const showReportsOnMap = useSelector(getShowReportsOnMap);

  const animationFrameID = useRef(null);
  const clicking = useRef(false);

  const [animationState, setAnimationState] = useState({ frame: 1, scale: 0.0, isRendering: false });
  const [bounceIDs, setBounceIDs] = useState([]);
  const [eventLayerIds, setEventLayerIds] = useState([]);
  const [eventsWithBounce, setEventsWithBounce] = useState(featureCollection([]));
  const [mapEventFeatures, setMapEventFeatures] = useState(featureCollection([]));

  const onLayerInit = useCallback(() => setEventLayerIds([
    EVENT_SYMBOLS,
    `${EVENT_SYMBOLS}-labels`,
    `${EVENT_SYMBOLS}-unclustered`,
    `${EVENT_SYMBOLS}-unclustered-labels`,
    EVENT_GEOMETRY_LAYER,
  ]), []);

  const onEventSymbolClick = useMemo(() =>
    withMultiLayerHandlerAwareness(
      map,
      (event) => {
        if (!clicking.current) {
          clicking.current = true;

          const clickedLayer = map.queryRenderedFeatures(event.point, { layers: eventLayerIds })[0];
          onEventClick({ event, layer: clickedLayer });

          setTimeout(() => {
            clicking.current = false;
          });
        }
      }
    ), [eventLayerIds, map, onEventClick]);

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
    'text-size': 0,
    ...mapUserLayoutConfig,
  }), [SCALE_ICON_IF_BOUNCED, mapUserLayoutConfig]);

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
    'text-font': [
      'case',
      ['==', ['get', 'locallyEdited'], true],
      ['literal', ['Open Sans Italic']],
      ['literal', ['Open Sans Semibold', 'Arial Unicode MS Bold']],
    ],
    ...mapUserLayoutConfigByLayerId(EVENT_SYMBOLS),
  }), [SCALE_FONT_IF_BOUNCED, mapUserLayoutConfigByLayerId]);

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

  useEffect(() => {
    setEventsWithBounce({
      ...eventPointFeatureCollection,
      features: addBounceToEventMapFeatures(eventPointFeatureCollection.features, bounceEventIDs),
    });
  }, [bounceEventIDs, eventPointFeatureCollection]);

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

  useEffect(() => {
    const addClusterIconToMap = () => {
      if (!map.hasImage('event-cluster-icon')) {
        addMapImage({ src: ClusterIcon, id: 'event-cluster-icon' });
      }
    };

    addClusterIconToMap();
  }, [map]);

  const geoJson = {
    ...mapEventFeatures,
    features: !shouldEventsBeClustered && !!showReportsOnMap ? mapEventFeatures.features : [],
  };
  useMapSource(UNCLUSTERED_EVENTS_SOURCE, geoJson);

  const isSubjectSymbolsLayerReady = !!map.getLayer(SUBJECT_SYMBOLS);
  const isClustersSourceReady = !!map.getSource(CLUSTERS_SOURCE_ID);
  const isEventsLayerReady = !!map.getLayer(EVENT_SYMBOLS);
  return <>
    {isSubjectSymbolsLayerReady && <>
      <LabeledSymbolLayer
        before={SUBJECT_SYMBOLS}
        filter={SYMBOL_LAYER_FILTER}
        id={`${EVENT_SYMBOLS}-unclustered`}
        layout={eventIconLayout}
        minZoom={minZoom}
        onClick={onEventSymbolClick}
        onInit={onLayerInit}
        sourceId={UNCLUSTERED_EVENTS_SOURCE}
        textLayout={eventLabelLayout}
        textPaint={EVENTS_LAYER_TEXT_PAINT}
        type="symbol"
      />

      {isClustersSourceReady && <>
        <LabeledSymbolLayer
          before={SUBJECT_SYMBOLS}
          filter={SYMBOL_LAYER_FILTER}
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

      {isEventsLayerReady && <EventGeometryLayer onClick={onEventSymbolClick} />}
    </>}

    {!!eventPointFeatureCollection?.features?.length && <MapImageFromSvgSpriteRenderer
      reportFeatureCollection={eventPointFeatureCollection}
    />}
  </>;
};

EventsLayer.defaultProps = {
  bounceEventIDs: [],
  mapImages: {},
};

EventsLayer.propTypes = {
  bounceEventIDs: PropTypes.string,
  mapImages: PropTypes.object,
  mapUserLayoutConfig: PropTypes.object.isRequired,
  mapUserLayoutConfigByLayerId: PropTypes.func.isRequired,
  minZoom: PropTypes.number.isRequired,
  onEventClick: PropTypes.func.isRequired,
};

export default memo(withMapViewConfig(EventsLayer));
