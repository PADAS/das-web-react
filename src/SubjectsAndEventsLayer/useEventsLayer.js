import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { featureCollection } from '@turf/helpers';
import { useSelector } from 'react-redux';

import { addBounceToEventMapFeatures } from '../utils/events';
import {
  DEFAULT_SYMBOL_LAYOUT,
  IF_IS_GENERIC,
  LAYER_IDS,
  MAP_ICON_SCALE,
  SUBJECT_FEATURE_CONTENT_TYPE,
} from '../constants';
import { getMapEventFeatureCollectionWithVirtualDate } from '../selectors/events';
import { MapContext } from '../App';
import MapImageFromSvgSpriteRenderer, { calcSvgImageIconId } from '../MapImageFromSvgSpriteRenderer';

import LabeledSymbolLayer from '../LabeledSymbolLayer';

const { EVENT_SYMBOLS, SUBJECT_SYMBOLS, SUBJECTS_AND_EVENTS_SOURCE_ID } = LAYER_IDS;

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

export default (bounceEventIDs, mapEventsUserLayoutConfig, mapImages, minZoom, onEventClick) => {
  const map = useContext(MapContext);

  const eventFeatureCollection = useSelector((state) => getMapEventFeatureCollectionWithVirtualDate(state));

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
    ...mapEventsUserLayoutConfig,
    'text-size': 0,
  }), [SCALE_ICON_IF_BOUNCED, mapEventsUserLayoutConfig]);

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
    ...mapEventsUserLayoutConfig,
  }), [SCALE_FONT_IF_BOUNCED, mapEventsUserLayoutConfig]);

  const renderedEventsLayer = <>
    <LabeledSymbolLayer
      before={SUBJECT_SYMBOLS}
      filter={['all', ['!=', 'content_type', SUBJECT_FEATURE_CONTENT_TYPE], ['!has', 'point_count']]}
      id={EVENT_SYMBOLS}
      layout={eventIconLayout}
      minZoom={minZoom}
      onClick={onEventSymbolClick}
      onInit={setEventLayerIds}
      sourceId={SUBJECTS_AND_EVENTS_SOURCE_ID}
      textLayout={eventLabelLayout}
      textPaint={EVENTS_LAYER_TEXT_PAINT}
      type="symbol"
    />
    {!!eventFeatureCollection?.features?.length && <MapImageFromSvgSpriteRenderer
      reportFeatureCollection={eventFeatureCollection}
    />}
  </>;

  return { mapEventFeatures, renderedEventsLayer };
};
