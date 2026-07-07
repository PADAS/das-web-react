import { featureCollection } from '@turf/turf';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  buildEventTypeValueMap,
  isFeatureVisibleAtVirtualDate,
  normalizeTileEventFeature,
  resolveEventTimeSliderParameters,
} from '../utils/event-vector-tiles';
import { EMPTY_TILE_EVENT_FEATURES, TileEventFeaturesContext } from '../hooks/useTileEventFeatures';
import { MapContext } from '../MapContext';
import { PREVIEW_FEATURES, SOURCE_IDS } from '../constants';
import { selectTileExcludedEventIds } from '../selectors/events-realtime-overlay';
import { usePreviewFeature } from '../hooks';

const CENTROID_SOURCE_LAYER = 'event_centroids';
const POINT_SOURCE_LAYER = 'events';

const EVENT_TYPES_WAIT_TIMEOUT_MS = 10000;

// Reads the events currently rendered in the vector tiles, normalizes them to
// plain event features, and provides them through context.
const TileEventFeaturesProvider = ({ children }) => {
  const map = useContext(MapContext);

  const eventVectorTilesEnabled = usePreviewFeature(PREVIEW_FEATURES.EVENTS_VECTOR_TILES);

  const eventFilterDateRange = useSelector((state) => state.data.eventFilter?.filter?.date_range);
  const eventTypes = useSelector((state) => state.data.eventTypes);
  const tileExcludedEventIds = useSelector(selectTileExcludedEventIds);
  const timeSliderState = useSelector((state) => state.view.timeSliderState);

  const eventTypeValueMap = useMemo(() => buildEventTypeValueMap(eventTypes), [eventTypes]);

  const timeSliderParameters = useMemo(
    () => resolveEventTimeSliderParameters(timeSliderState, eventFilterDateRange),
    [timeSliderState, eventFilterDateRange]
  );

  // recompute() is bound to long-lived map listeners, so it reads its inputs
  // from refs rather than closing over them, that keeps it stable and avoids
  // re-binding the listeners on every change.
  const enabledRef = useRef(eventVectorTilesEnabled);
  const eventTypesWaitTimedOutRef = useRef(false);
  const eventTypeValueMapRef = useRef(eventTypeValueMap);
  const excludedIdsRef = useRef(new Set(tileExcludedEventIds));
  // Bumped on every input change so the republish signature differs even when
  // the id set is the same.
  const inputsVersionRef = useRef(0);
  const lastSignatureRef = useRef(null);
  const timeSliderRef = useRef(timeSliderParameters);

  const [tileFeatures, setTileFeatures] = useState(EMPTY_TILE_EVENT_FEATURES);

  // Reset to empty and clear the signature so the next non-empty result always
  // republishes.
  const publishEmpty = useCallback(() => {
    lastSignatureRef.current = null;
    setTileFeatures(EMPTY_TILE_EVENT_FEATURES);
  }, []);

  const recompute = useCallback(() => {
    if (!enabledRef.current || !map?.getSource?.(SOURCE_IDS.EVENTS_VECTOR_SOURCE)) {
      publishEmpty();
      return;
    }

    // Event types haven't loaded yet, every feature would normalize to the
    // 'generic' icon fallback. Wait, unless a failed/empty event-types fetch
    // would otherwise hide every event on the map forever.
    if (!eventTypeValueMapRef.current.size && !eventTypesWaitTimedOutRef.current) {
      publishEmpty();
      return;
    }

    // Point events come from the point source-layer; polygon events come from
    // their centroid source-layer.
    const rawPoints = map.querySourceFeatures(SOURCE_IDS.EVENTS_VECTOR_SOURCE, { sourceLayer: POINT_SOURCE_LAYER });
    const rawCentroids = map.querySourceFeatures(SOURCE_IDS.EVENTS_VECTOR_SOURCE, { sourceLayer: CENTROID_SOURCE_LAYER });
    const excludedIds = excludedIdsRef.current;
    const timeSliderParams = timeSliderRef.current;

    // Collect one feature per event id, skipping excluded ids and anything the
    // time slider hides. The same event repeats across tiles, so dedupe;
    // points key on `id`, centroids on `event_id`.
    const seen = new Set();
    const survivors = [];
    const collect = (features, idField) => {
      for (const feature of features) {
        const id = feature.properties?.[idField];

        if (!id || seen.has(id)) {
          continue;
        }

        seen.add(id);

        if (excludedIds.has(id) || !isFeatureVisibleAtVirtualDate(feature, timeSliderParams)) {
          continue;
        }

        survivors.push({ feature, id, idField });
      }
    };
    collect(rawPoints, 'id');
    collect(rawCentroids, 'event_id');

    if (!survivors.length) {
      publishEmpty();
      return;
    }

    // The listeners fire far more often than the result changes, so skip
    // republishing when neither the inputs nor the visible id set has changed
    // since last time.
    const signature = `${inputsVersionRef.current}|${survivors.map((survivor) => survivor.id).sort().join(',')}`;
    if (signature === lastSignatureRef.current) {
      return;
    }

    lastSignatureRef.current = signature;

    const valueMap = eventTypeValueMapRef.current;
    setTileFeatures(featureCollection(
      survivors.map(({ feature, idField }) => normalizeTileEventFeature(feature, valueMap, { idField }))
    ));
  }, [map, publishEmpty]);

  useEffect(() => {
    // Keep the refs current as inputs change, then recompute against the fresh
    // values.
    enabledRef.current = eventVectorTilesEnabled;
    eventTypeValueMapRef.current = eventTypeValueMap;
    inputsVersionRef.current += 1;
    excludedIdsRef.current = new Set(tileExcludedEventIds);
    timeSliderRef.current = timeSliderParameters;

    recompute();
  }, [eventVectorTilesEnabled, tileExcludedEventIds, timeSliderParameters, eventTypeValueMap, recompute]);

  useEffect(() => {
    if (!eventVectorTilesEnabled || eventTypeValueMap.size) {
      eventTypesWaitTimedOutRef.current = false;
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      eventTypesWaitTimedOutRef.current = true;
      recompute();
    }, EVENT_TYPES_WAIT_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [eventVectorTilesEnabled, eventTypeValueMap, recompute]);

  useEffect(() => {
    // Recompute when the rendered tiles change.
    if (map && eventVectorTilesEnabled) {
      const onSourceData = (event) => {
        if (event.sourceId === SOURCE_IDS.EVENTS_VECTOR_SOURCE) {
          recompute();
        }
      };

      map.on('sourcedata', onSourceData);
      map.on('moveend', recompute);

      recompute();

      return () => {
        map.off('sourcedata', onSourceData);
        map.off('moveend', recompute);
      };
    }
  }, [eventVectorTilesEnabled, map, recompute]);

  return (
    <TileEventFeaturesContext.Provider value={tileFeatures}>
      {children}
    </TileEventFeaturesContext.Provider>
  );
};

export default TileEventFeaturesProvider;
