import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import noop from 'lodash/noop';
import { useSelector } from 'react-redux';

import {
  API_URL,
  DEFAULT_SYMBOL_LAYOUT,
  DEFAULT_SYMBOL_PAINT,
  LAYER_IDS,
  MAP_ICON_SCALE,
  SOURCE_IDS,
} from '../constants';
import {
  buildEventTimeSliderFadeColor,
  buildEventTimeSliderHideFilter,
  resolveEventTimeSliderParameters,
  TIME_SLIDER_DEFAULT_LABEL_COLOR,
} from '../utils/event-vector-tiles';
import { calcEventFilterForRequest } from '../utils/event-filter';
import { MapContext } from '../MapContext';
import { objectToParamString } from '../utils/query';
import { safeRemoveMapLayer, safeRemoveMapSource } from '../utils/map';
import { selectRealtimeOverlayFeatureIds } from '../selectors/events-realtime-overlay';
import { selectShouldEventsBeClustered } from '../selectors/clusters';
import { useMapEventBinding, useMemoCompare } from '../hooks';
import withMapViewConfig from '../WithMapViewConfig';
import { withMultiLayerHandlerAwareness } from '../utils/map-handlers';

const LABELS_LAYER_ID = `${LAYER_IDS.EVENTS_VECTOR_SYMBOLS}-labels`;
const MAX_TILE_ZOOM = 24;
const MIN_TILE_ZOOM = 3;
const MATCH_NOTHING_FILTER = ['in', ['get', 'id'], ['literal', []]];
const SOURCE_LAYER = 'events';
const SOURCE_REBUILD_DEBOUNCE_MS = 400;
const VECTOR_TILE_BASE = `${API_URL}activity/events/tiles/{z}/{x}/{y}.pbf`;

const combineLayerFilters = (...filters) => {
  const applied = filters.filter(Boolean);
  if (!applied.length) {
    return null;
  }

  if (applied.length === 1) {
    return applied[0];
  }

  return ['all', ...applied];
};

// Build the tile source URL with the active event filter baked in.
// sort_by/bbox are dropped: tile order is irrelevant and z/x/y is the bbox.
export const buildEventTileUrl = () => {
  const filterObject = calcEventFilterForRequest({ format: 'object' });
  delete filterObject.sort_by;
  delete filterObject.bbox;

  const paramString = objectToParamString(filterObject);
  return paramString ? `${VECTOR_TILE_BASE}?${paramString}` : VECTOR_TILE_BASE;
};

const EventsVectorLayer = ({ mapUserLayoutConfig, mapUserLayoutConfigByLayerId, onEventClick }) => {
  const map = useContext(MapContext);

  const eventFilter = useSelector((state) => state.data.eventFilter);
  const eventStore = useSelector((state) => state.data.eventStore);
  const eventTypes = useSelector((state) => state.data.eventTypes);
  const realtimeOverlayFeatureIds = useSelector(selectRealtimeOverlayFeatureIds);
  const shouldEventsBeClustered = useSelector(selectShouldEventsBeClustered);
  const showReportsOnMap = useSelector((state) => state.data.mapLayerFilter.showReportsOnMap);
  const timeSliderState = useSelector((state) => state.view?.timeSliderState);

  // Guards against the click firing twice when the icon and label layers overlap.
  const clicking = useRef(false);

  // Mirror eventStore in a ref so the click handler can hydrate from it without listing eventStore
  // as a dependency.
  const eventStoreRef = useRef(eventStore);
  useEffect(() => {
    eventStoreRef.current = eventStore;
  }, [eventStore]);

  const [tileUrl, setTileUrl] = useState(buildEventTileUrl);
  const appliedTileUrl = useRef(tileUrl);

  const debouncedRebuildUrl = useMemo(
    () => debounce(() => setTileUrl(buildEventTileUrl()), SOURCE_REBUILD_DEBOUNCE_MS),
    []
  );

  // Resolve the icon id from the event types store (the tile only carries
  // event_type_value); 'generic' is the fallback, matching the GeoJSON path.
  const iconIdExpression = useMemo(() => {
    const matchPairs = (eventTypes || [])
      .filter((eventType) => eventType.value && eventType.icon_id)
      .flatMap((eventType) => [eventType.value, eventType.icon_id]);

    return matchPairs.length
      ? ['match', ['get', 'event_type_value'], ...matchPairs, 'generic']
      : 'generic';
  }, [eventTypes]);

  // icon-image: `{icon_id}-{priority}` (+ width/height when present).
  const iconImageExpression = useMemo(() => ['concat',
    iconIdExpression,
    '-',
    ['get', 'priority'],
    ['case', ['has', 'width'], ['concat', '-', ['get', 'width']], ''],
    ['case', ['has', 'height'], ['concat', '-', ['get', 'height']], ''],
  ], [iconIdExpression]);

  // Generic events render smaller (mirroring IF_IS_GENERIC on the GeoJSON path). Tile
  // features have no `image` prop, so detect generic from the resolved icon id instead.
  const ifIsGeneric = useCallback(
    (ifGeneric, ifNonGeneric) => ['case', ['==', iconIdExpression, 'generic'], ifGeneric, ifNonGeneric],
    [iconIdExpression]
  );

  // Label text: title + the server's preformatted UTC date.
  const labelTextExpression = useMemo(() => {
    const matchPairs = (eventTypes || [])
      .filter((eventType) => eventType.value && eventType.display)
      .flatMap((eventType) => [eventType.value, eventType.display]);
    const eventTypeDisplay = matchPairs.length
      ? ['match', ['get', 'event_type_value'], ...matchPairs, '']
      : '';

    const titleExpression = [
      'case',
      ['all', ['has', 'title'], ['!=', ['get', 'title'], '']], ['get', 'title'],
      eventTypeDisplay,
    ];

    return [
      'case',
      ['all', ['has', 'event_time_display'], ['!=', ['get', 'event_time_display'], '']],
      ['concat', titleExpression, '\n', ['get', 'event_time_display']],
      titleExpression,
    ];
  }, [eventTypes]);

  const iconLayout = useMemo(() => ({
    ...DEFAULT_SYMBOL_LAYOUT,
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
    'icon-image': iconImageExpression,
    'icon-size': [
      'interpolate', ['exponential', 0.5], ['zoom'],
      0, ifIsGeneric(0.125 / MAP_ICON_SCALE, 0.25 / MAP_ICON_SCALE),
      12, ifIsGeneric(0.5 / MAP_ICON_SCALE, 1 / MAP_ICON_SCALE),
    ],
    'text-field': '',
    'text-size': 0,
    ...mapUserLayoutConfig,
  }), [iconImageExpression, ifIsGeneric, mapUserLayoutConfig]);

  const stableIconLayout = useMemoCompare(iconLayout);

  const labelLayout = useMemo(() => ({
    ...DEFAULT_SYMBOL_LAYOUT,
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
    'icon-anchor': 'bottom',
    'icon-image': 'name-label-78-sdf',
    'icon-size': 1,
    'icon-text-fit': 'both',
    'icon-text-fit-padding': [5, 8, 5, 8],
    'text-anchor': 'top',
    'text-offset': [0, 1.1],
    'text-field': labelTextExpression,
    'text-justify': 'center',
    'text-size': ['interpolate', ['exponential', 0.5], ['zoom'], 0, 5, 6, 8, 14, 13],
    ...mapUserLayoutConfigByLayerId(LAYER_IDS.EVENT_SYMBOLS),
  }), [labelTextExpression, mapUserLayoutConfigByLayerId]);

  const stableLabelLayout = useMemoCompare(labelLayout);

  const labelPaint = useMemo(() => ({
    ...DEFAULT_SYMBOL_PAINT,
    'icon-opacity': 0.5,
    'icon-color': TIME_SLIDER_DEFAULT_LABEL_COLOR,
  }), []);

  const eventFilterDateRange = eventFilter?.filter?.date_range;
  const eventTimeSliderParameters = useMemo(
    () => resolveEventTimeSliderParameters(timeSliderState, eventFilterDateRange),
    [timeSliderState, eventFilterDateRange]
  );

  const fadeColor = useMemo(
    () => buildEventTimeSliderFadeColor(
      eventTimeSliderParameters.active,
      eventTimeSliderParameters.totalRangeDistance,
      eventTimeSliderParameters.virtualDateMs
    ),
    [eventTimeSliderParameters]
  );

  const layerFilter = useMemo(() => {
    if (shouldEventsBeClustered || !showReportsOnMap) {
      return MATCH_NOTHING_FILTER;
    }

    return combineLayerFilters(
      realtimeOverlayFeatureIds.length
        ? ['!', ['in', ['get', 'id'], ['literal', realtimeOverlayFeatureIds]]]
        : null,
      buildEventTimeSliderHideFilter(
        eventTimeSliderParameters.active,
        eventTimeSliderParameters.virtualDateIso
      ),
    );
  }, [eventTimeSliderParameters, realtimeOverlayFeatureIds, shouldEventsBeClustered, showReportsOnMap]);

  useEffect(() => {
    // Rebuild the tile source URL (debounced) whenever the event filter
    // changes.
    debouncedRebuildUrl();
    return () => debouncedRebuildUrl.cancel();
  }, [eventFilter, debouncedRebuildUrl]);

  useEffect(() => {
    if (map) {
      // Create the source + icon/label layers once. The bearer token is added by the
      // map-wide transformRequest (EarthRangerMap), so no per-source auth is needed.
      if (!map.getSource(SOURCE_IDS.EVENTS_VECTOR_SOURCE)) {
        map.addSource(SOURCE_IDS.EVENTS_VECTOR_SOURCE, {
          type: 'vector',
          tiles: [tileUrl],
          minzoom: MIN_TILE_ZOOM,
          maxzoom: MAX_TILE_ZOOM,
        });
      }

      const before = map.getLayer(LAYER_IDS.SUBJECT_SYMBOLS) ? LAYER_IDS.SUBJECT_SYMBOLS : undefined;

      if (!map.getLayer(LAYER_IDS.EVENTS_VECTOR_SYMBOLS)) {
        map.addLayer({
          id: LAYER_IDS.EVENTS_VECTOR_SYMBOLS,
          type: 'symbol',
          source: SOURCE_IDS.EVENTS_VECTOR_SOURCE,
          'source-layer': SOURCE_LAYER,
          layout: stableIconLayout,
          paint: {},
        }, before);
      }

      if (!map.getLayer(LABELS_LAYER_ID)) {
        map.addLayer({
          id: LABELS_LAYER_ID,
          type: 'symbol',
          source: SOURCE_IDS.EVENTS_VECTOR_SOURCE,
          'source-layer': SOURCE_LAYER,
          layout: stableLabelLayout,
          paint: labelPaint,
        }, before);
      }

      return () => {
        safeRemoveMapLayer(map, LABELS_LAYER_ID);
        safeRemoveMapLayer(map, LAYER_IDS.EVENTS_VECTOR_SYMBOLS);
        safeRemoveMapSource(map, SOURCE_IDS.EVENTS_VECTOR_SOURCE);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    // Apply filter changes by swapping the tile URLs in place — no teardown/blink.
    if (appliedTileUrl.current === tileUrl) return;
    appliedTileUrl.current = tileUrl;
    map?.getSource?.(SOURCE_IDS.EVENTS_VECTOR_SOURCE)?.setTiles?.([tileUrl]);
  }, [map, tileUrl]);

  useEffect(() => {
    if (map) {
      // Keep layouts in sync without rebuilding the source (icon-image once event types
      // load, the show-names toggle, etc.).
      if (map.getLayer(LAYER_IDS.EVENTS_VECTOR_SYMBOLS)) {
        Object.entries(stableIconLayout).forEach(
          ([key, value]) => map.setLayoutProperty(LAYER_IDS.EVENTS_VECTOR_SYMBOLS, key, value)
        );
      }

      if (map.getLayer(LABELS_LAYER_ID)) {
        Object.entries(stableLabelLayout).forEach(
          ([key, value]) => map.setLayoutProperty(LABELS_LAYER_ID, key, value)
        );
      }
    }
  }, [map, stableIconLayout, stableLabelLayout]);

  useEffect(() => {
    if (map) {
      // Apply the composed overlay-exclusion + time-slider-hide filter to both layers.
      [LAYER_IDS.EVENTS_VECTOR_SYMBOLS, LABELS_LAYER_ID].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setFilter(layerId, layerFilter);
        }
      });
    }
  }, [map, layerFilter]);

  useEffect(() => {
    if (map && map.getLayer(LABELS_LAYER_ID)) {
      // Time-slider fade.
      map.setPaintProperty(LABELS_LAYER_ID, 'icon-color', fadeColor);
    }
  }, [map, fadeColor]);

  // Click -> open the event, hydrating from eventStore.
  /* eslint-disable react-hooks/refs */
  const handleEventClick = useMemo(() => (map ? withMultiLayerHandlerAwareness(
    map,
    (event) => {
      // Bound to both the icon and label layers, so guard against the overlapping
      // single click invoking it twice.
      if (!clicking.current) {
        clicking.current = true;
        setTimeout(() => { clicking.current = false; });

        const clickedFeature = map.queryRenderedFeatures(
          event.point,
          {
            layers: [LAYER_IDS.EVENTS_VECTOR_SYMBOLS, LABELS_LAYER_ID].filter((id) => map.getLayer(id)),
          }
        )[0];
        if (clickedFeature && onEventClick){
          const eventId = clickedFeature.properties.id;
          const storeEvent = eventStoreRef.current[eventId];
          if (storeEvent) {
            onEventClick({ event, layer: { properties: storeEvent } });
          } else {
            onEventClick({
              event,
              layer: {
                properties: {
                  ...clickedFeature.properties,
                  event_type: clickedFeature.properties.event_type_value
                },
              },
            });
          }
        }
      };
    }
  ) : noop), [map, onEventClick]);
  /* eslint-enable react-hooks/refs */

  const onMouseEnter = useCallback(() => {
    if (map) {
      map.getCanvas().style.cursor = 'pointer';
    }
  }, [map]);

  const onMouseLeave = useCallback((event) => {
    if (map) {
      const layers = [LAYER_IDS.EVENTS_VECTOR_SYMBOLS, LABELS_LAYER_ID].filter((id) => map.getLayer(id));
      if (!map.queryRenderedFeatures(event.point, { layers }).length) {
        map.getCanvas().style.cursor = '';
      }
    }
  }, [map]);

  useMapEventBinding('click', handleEventClick, LAYER_IDS.EVENTS_VECTOR_SYMBOLS, !!onEventClick);
  useMapEventBinding('click', handleEventClick, LABELS_LAYER_ID, !!onEventClick);

  useMapEventBinding('mouseenter', onMouseEnter, LAYER_IDS.EVENTS_VECTOR_SYMBOLS);
  useMapEventBinding('mouseenter', onMouseEnter, LABELS_LAYER_ID);
  useMapEventBinding('mouseleave', onMouseLeave, LAYER_IDS.EVENTS_VECTOR_SYMBOLS);
  useMapEventBinding('mouseleave', onMouseLeave, LABELS_LAYER_ID);

  return null;
};

export default memo(withMapViewConfig(EventsVectorLayer));
