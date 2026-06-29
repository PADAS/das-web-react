import { memo, useContext, useEffect, useMemo, useRef } from 'react';
import debounce from 'lodash/debounce';
import { featureCollection } from '@turf/turf';
import noop from 'lodash/noop';
import { useDispatch, useSelector } from 'react-redux';

import { addRealtimeOverlayEvent, pruneRealtimeOverlayEvents } from '../ducks/events-realtime-overlay';
import {
  buildEventTimeSliderFadeColor,
  buildEventTimeSliderHideFilter,
  EVENT_GEOMETRY_FILL_PAINT,
  resolveEventTimeSliderParameters,
} from '../utils/event-vector-tiles';
import {
  DEFAULT_SYMBOL_LAYOUT,
  IF_IS_GENERIC,
  LAYER_IDS,
  MAP_ICON_SCALE,
  REALTIME_OVERLAY_WINDOW_MS,
  SOURCE_IDS,
} from '../constants';
import { fetchRecentEventsIntoRealtimeOverlay } from '../ducks/events';
import { MAP_LOCATION_SELECTION_MODES } from '../ducks/map-ui';
import {
  selectRealtimeOverlayFeatureCollection,
  selectRealtimeOverlayPolygonFeatureCollection,
} from '../selectors/events-realtime-overlay';
import { selectShouldEventsBeClustered } from '../selectors/clusters';
import LabeledSymbolLayer from '../LabeledSymbolLayer';
import { MapContext } from '../MapContext';
import { safeRemoveMapLayer, safeRemoveMapSource } from '../utils/map';
import { useMapEventBinding } from '../hooks';
import { withMultiLayerHandlerAwareness } from '../utils/map-handlers';

const EMPTY_FEATURE_COLLECTION = featureCollection([]);
const FETCH_RECENT_EVENTS_DEBOUNCE_MS = 400;
const LABELS_LAYER_ID = `${LAYER_IDS.EVENTS_REALTIME_OVERLAY_SYMBOLS}-labels`;
const PRUNE_INTERVAL_MS = 60 * 1000;
// Overlay layers that show a pointer cursor. The fill's mouseleave checks all of them (mirroring
// EventsVectorLayer) so a fast move onto an adjacent overlay feature — where Mapbox may fire the
// leave after the next layer's enter — doesn't wrongly clear the cursor.
const POINTER_LAYER_IDS = [
  LAYER_IDS.EVENTS_REALTIME_OVERLAY_SYMBOLS,
  LABELS_LAYER_ID,
  LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY,
];

const ICON_LAYOUT = {
  ...DEFAULT_SYMBOL_LAYOUT,
  'icon-allow-overlap': true,
  'text-allow-overlap': true,
  'icon-image': ['concat',
    ['get', 'icon_id'],
    '-',
    ['get', 'priority'],
    ['case', ['has', 'width'], ['concat', '-', ['get', 'width']], ''],
    ['case', ['has', 'height'], ['concat', '-', ['get', 'height']], ''],
  ],
  'icon-size': [
    'interpolate', ['exponential', 0.5], ['zoom'],
    0, IF_IS_GENERIC(0.125 / MAP_ICON_SCALE, 0.25 / MAP_ICON_SCALE),
    12, IF_IS_GENERIC(0.5 / MAP_ICON_SCALE, 1 / MAP_ICON_SCALE),
  ],
  'text-field': '',
  'text-size': 0,
};

const LABEL_LAYOUT = {
  'text-field': '{display_title}',
  'text-size': ['interpolate', ['exponential', 0.5], ['zoom'], 0, 5, 6, 8, 14, 13],
  'text-font': [
    'case',
    ['==', ['get', 'locallyEdited'], true],
    ['literal', ['Open Sans Italic']],
    ['literal', ['Open Sans Semibold', 'Arial Unicode MS Bold']],
  ],
};

// Renders the events realtime overlay layered above the vector tile so
// creates/edits appear instantly.
const EventsRealtimeOverlayLayer = ({ onEventClick }) => {
  const dispatch = useDispatch();

  const map = useContext(MapContext);

  const drawingEventId = useSelector((state) => {
    const mapLocationSelection = state.view?.mapLocationSelection;
    const isDrawingEventGeometry = mapLocationSelection?.isPickingLocation
      && mapLocationSelection.mode === MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY;

    return isDrawingEventGeometry ? (mapLocationSelection.event?.id ?? '') : '';
  });
  const eventFilterDateRange = useSelector((state) => state.data.eventFilter?.filter?.date_range);
  const locallyEditedEventId = useSelector((state) => state.data.locallyEditedEvent?.id);
  const realtimeOverlayFeatureCollection = useSelector(selectRealtimeOverlayFeatureCollection);
  const realtimeOverlayPolygonFeatureCollection = useSelector(selectRealtimeOverlayPolygonFeatureCollection);
  const shouldEventsBeClustered = useSelector(selectShouldEventsBeClustered);
  const showReportsOnMap = useSelector((state) => state.data.mapLayerFilter.showReportsOnMap);
  const timeSliderState = useSelector((state) => state.view?.timeSliderState);

  // Guards against the click firing twice when the icon and label layers overlap.
  const clicking = useRef(false);

  const overlayVisibility = shouldEventsBeClustered ? 'none' : 'visible';
  const sourceData = showReportsOnMap ? realtimeOverlayFeatureCollection : EMPTY_FEATURE_COLLECTION;
  const polygonSourceData = useMemo(() => {
    if (!showReportsOnMap) {
      return EMPTY_FEATURE_COLLECTION;
    }

    if (!drawingEventId) {
      return realtimeOverlayPolygonFeatureCollection;
    }

    return featureCollection(
      realtimeOverlayPolygonFeatureCollection.features.filter((feature) => feature.properties.id !== drawingEventId)
    );
  }, [showReportsOnMap, drawingEventId, realtimeOverlayPolygonFeatureCollection]);

  const iconLayout = useMemo(() => ({ ...ICON_LAYOUT, visibility: overlayVisibility }), [overlayVisibility]);
  const labelLayout = useMemo(() => ({ ...LABEL_LAYOUT, visibility: overlayVisibility }), [overlayVisibility]);

  const fetchRecentEvents = useMemo(
    () => debounce(() => dispatch(fetchRecentEventsIntoRealtimeOverlay(map)), FETCH_RECENT_EVENTS_DEBOUNCE_MS),
    [dispatch, map]
  );

  const eventTimeSliderParameters = useMemo(
    () => resolveEventTimeSliderParameters(timeSliderState, eventFilterDateRange),
    [timeSliderState, eventFilterDateRange]
  );

  const textPaint = useMemo(
    () => ({
      'icon-color': buildEventTimeSliderFadeColor(
        eventTimeSliderParameters.active,
        eventTimeSliderParameters.totalRangeDistance,
        eventTimeSliderParameters.virtualDateMs
      )
    }),
    [eventTimeSliderParameters]
  );

  const hideFilter = useMemo(
    () => buildEventTimeSliderHideFilter(
      eventTimeSliderParameters.active,
      eventTimeSliderParameters.virtualDateIso
    ) ?? ['all'],
    [eventTimeSliderParameters]
  );

  useEffect(() => {
    if (map && !map.getSource(SOURCE_IDS.EVENTS_REALTIME_OVERLAY_SOURCE)) {
      map.addSource(SOURCE_IDS.EVENTS_REALTIME_OVERLAY_SOURCE, {
        type: 'geojson',
        data: EMPTY_FEATURE_COLLECTION,
      });
    }

    return () => {
      safeRemoveMapLayer(map, LABELS_LAYER_ID);
      safeRemoveMapLayer(map, LAYER_IDS.EVENTS_REALTIME_OVERLAY_SYMBOLS);
      safeRemoveMapSource(map, SOURCE_IDS.EVENTS_REALTIME_OVERLAY_SOURCE);
    };
  }, [map]);

  useEffect(() => {
    map?.getSource?.(SOURCE_IDS.EVENTS_REALTIME_OVERLAY_SOURCE)?.setData?.(sourceData);
  }, [map, sourceData]);

  useEffect(() => {
    if (map) {
      if (!map.getSource(SOURCE_IDS.EVENTS_REALTIME_OVERLAY_POLYGON_SOURCE)) {
        map.addSource(SOURCE_IDS.EVENTS_REALTIME_OVERLAY_POLYGON_SOURCE, {
          type: 'geojson',
          data: EMPTY_FEATURE_COLLECTION,
        });
      }

      if (!map.getLayer(LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY)) {
        const before = map.getLayer(LAYER_IDS.EVENTS_REALTIME_OVERLAY_SYMBOLS)
          ? LAYER_IDS.EVENTS_REALTIME_OVERLAY_SYMBOLS
          : (map.getLayer(LAYER_IDS.SUBJECT_SYMBOLS) ? LAYER_IDS.SUBJECT_SYMBOLS : undefined);
        map.addLayer({
          id: LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY,
          type: 'fill',
          source: SOURCE_IDS.EVENTS_REALTIME_OVERLAY_POLYGON_SOURCE,
          layout: {},
          paint: EVENT_GEOMETRY_FILL_PAINT,
        }, before);
      }
    }

    return () => {
      safeRemoveMapLayer(map, LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY);
      safeRemoveMapSource(map, SOURCE_IDS.EVENTS_REALTIME_OVERLAY_POLYGON_SOURCE);
    };
  }, [map]);

  useEffect(() => {
    map?.getSource?.(SOURCE_IDS.EVENTS_REALTIME_OVERLAY_POLYGON_SOURCE)?.setData?.(polygonSourceData);
  }, [map, polygonSourceData]);

  useEffect(() => {
    // Time-slider hide on the overlay fill.
    if (map?.getLayer?.(LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY)) {
      map.setFilter(LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY, hideFilter);
    }
  }, [map, hideFilter]);

  useEffect(() => {
    // While an event is being edited, render it in the overlay instead of the
    // tile.
    if (locallyEditedEventId) {
      dispatch(addRealtimeOverlayEvent(locallyEditedEventId));
    }
  }, [locallyEditedEventId, dispatch]);

  useEffect(() => {
    // Periodically drop members older than the window; by then the tile has
    // refreshed.
    const interval = setInterval(
      () => dispatch(pruneRealtimeOverlayEvents(Date.now() - REALTIME_OVERLAY_WINDOW_MS)),
      PRUNE_INTERVAL_MS
    );

    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    if (map) {
      fetchRecentEvents();
      map.on('moveend', fetchRecentEvents);

      return () => {
        map.off('moveend', fetchRecentEvents);
        fetchRecentEvents.cancel();
      };
    }
  }, [map, fetchRecentEvents]);

  // Overlay features are full flattened events, so no eventStore hydration is needed.
  /* eslint-disable react-hooks/refs */
  const handleEventClick = useMemo(() => (map ? withMultiLayerHandlerAwareness(
    map,
    (event) => {
      // Bound to both the icon and label layers; guard against the overlapping single click
      // invoking it twice (read/written at click time, not during render).
      if (clicking.current) return;
      clicking.current = true;
      setTimeout(() => { clicking.current = false; });

      const clickedFeature = map.queryRenderedFeatures(
        event.point,
        {
          layers: [
            LAYER_IDS.EVENTS_REALTIME_OVERLAY_SYMBOLS,
            LABELS_LAYER_ID,
            LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY,
          ].filter((id) => map.getLayer(id)),
        }
      )[0];
      if (clickedFeature && onEventClick) {
        onEventClick({ event, layer: clickedFeature });
      }
    }
  ) : noop), [map, onEventClick]);
  /* eslint-enable react-hooks/refs */

  const onFillMouseEnter = useMemo(() => (map ? () => {
    map.getCanvas().style.cursor = 'pointer';
  } : noop), [map]);

  const onFillMouseLeave = useMemo(() => (map ? (event) => {
    const layers = POINTER_LAYER_IDS.filter((id) => map.getLayer(id));
    if (!map.queryRenderedFeatures(event.point, { layers }).length) {
      map.getCanvas().style.cursor = '';
    }
  } : noop), [map]);

  useMapEventBinding('click', handleEventClick, LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY, !!onEventClick);
  useMapEventBinding('mouseenter', onFillMouseEnter, LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY);
  useMapEventBinding('mouseleave', onFillMouseLeave, LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY);

  return <LabeledSymbolLayer
    before={map?.getLayer?.(LAYER_IDS.SUBJECT_SYMBOLS) ? LAYER_IDS.SUBJECT_SYMBOLS : undefined}
    filter={hideFilter}
    id={LAYER_IDS.EVENTS_REALTIME_OVERLAY_SYMBOLS}
    layout={iconLayout}
    onClick={handleEventClick}
    sourceId={SOURCE_IDS.EVENTS_REALTIME_OVERLAY_SOURCE}
    textLayout={labelLayout}
    textPaint={textPaint}
    type="symbol"
  />;
};

export default memo(EventsRealtimeOverlayLayer);
