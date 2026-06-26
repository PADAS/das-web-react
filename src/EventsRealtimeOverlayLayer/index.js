import { memo, useContext, useEffect, useMemo, useRef } from 'react';
import debounce from 'lodash/debounce';
import { featureCollection } from '@turf/turf';
import noop from 'lodash/noop';
import { useDispatch, useSelector } from 'react-redux';

import { addRealtimeOverlayEvent, pruneRealtimeOverlayEvents } from '../ducks/events-realtime-overlay';
import {
  buildEventTimeSliderFadeColor,
  buildEventTimeSliderHideFilter,
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
import { selectRealtimeOverlayFeatureCollection } from '../selectors/events-realtime-overlay';
import { selectShouldEventsBeClustered } from '../selectors/clusters';
import LabeledSymbolLayer from '../LabeledSymbolLayer';
import { MapContext } from '../MapContext';
import { safeRemoveMapLayer, safeRemoveMapSource } from '../utils/map';
import { withMultiLayerHandlerAwareness } from '../utils/map-handlers';

const EMPTY_FEATURE_COLLECTION = featureCollection([]);
const FETCH_RECENT_EVENTS_DEBOUNCE_MS = 400;
const LABELS_LAYER_ID = `${LAYER_IDS.EVENTS_REALTIME_OVERLAY_SYMBOLS}-labels`;
const PRUNE_INTERVAL_MS = 60 * 1000;

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

  const eventFilterDateRange = useSelector((state) => state.data.eventFilter?.filter?.date_range);
  const locallyEditedEventId = useSelector((state) => state.data.locallyEditedEvent?.id);
  const realtimeOverlayFeatureCollection = useSelector(selectRealtimeOverlayFeatureCollection);
  const shouldEventsBeClustered = useSelector(selectShouldEventsBeClustered);
  const showReportsOnMap = useSelector((state) => state.data.mapLayerFilter.showReportsOnMap);
  const timeSliderState = useSelector((state) => state.view?.timeSliderState);

  // Guards against the click firing twice when the icon and label layers overlap.
  const clicking = useRef(false);

  const overlayVisibility = shouldEventsBeClustered ? 'none' : 'visible';
  const sourceData = showReportsOnMap ? realtimeOverlayFeatureCollection : EMPTY_FEATURE_COLLECTION;

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
        { layers: [LAYER_IDS.EVENTS_REALTIME_OVERLAY_SYMBOLS, LABELS_LAYER_ID].filter((id) => map.getLayer(id)) }
      )[0];
      if (clickedFeature && onEventClick) {
        onEventClick({ event, layer: clickedFeature });
      }
    }
  ) : noop), [map, onEventClick]);
  /* eslint-enable react-hooks/refs */

  const before = map?.getLayer?.(LAYER_IDS.SUBJECT_SYMBOLS) ? LAYER_IDS.SUBJECT_SYMBOLS : undefined;

  return <LabeledSymbolLayer
    before={before}
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
