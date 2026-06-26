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
import { FEATURE_FLAGS, SOURCE_IDS } from '../constants';
import { MapContext } from '../MapContext';
import { selectRealtimeOverlayFeatureIds } from '../selectors/events-realtime-overlay';
import { useFeatureFlag } from '../hooks';

const SOURCE_LAYER = 'events';

const TileEventFeaturesProvider = ({ children }) => {
  const map = useContext(MapContext);

  const useEventVectorTiles = useFeatureFlag(FEATURE_FLAGS.EVENTS_VECTOR_TILES);

  const eventFilterDateRange = useSelector((state) => state.data.eventFilter?.filter?.date_range);
  const eventTypes = useSelector((state) => state.data.eventTypes);
  const realtimeOverlayFeatureIds = useSelector(selectRealtimeOverlayFeatureIds);
  const timeSliderState = useSelector((state) => state.view.timeSliderState);

  const eventTypeValueMap = useMemo(() => buildEventTypeValueMap(eventTypes), [eventTypes]);

  const timeSliderParameters = useMemo(
    () => resolveEventTimeSliderParameters(timeSliderState, eventFilterDateRange),
    [timeSliderState, eventFilterDateRange]
  );

  const enabledRef = useRef(useEventVectorTiles);
  const eventTypeValueMapRef = useRef(eventTypeValueMap);
  const inputsVersionRef = useRef(0);
  const lastSignatureRef = useRef(null);
  const overlayIdsRef = useRef(new Set(realtimeOverlayFeatureIds));
  const timeSliderRef = useRef(timeSliderParameters);

  const [tileFeatures, setTileFeatures] = useState(EMPTY_TILE_EVENT_FEATURES);

  const publishEmpty = useCallback(() => {
    lastSignatureRef.current = null;
    setTileFeatures(EMPTY_TILE_EVENT_FEATURES);
  }, []);

  const recompute = useCallback(() => {
    if (!enabledRef.current || !map?.getSource?.(SOURCE_IDS.EVENTS_VECTOR_SOURCE)) {
      publishEmpty();
      return;
    }

    const raw = map.querySourceFeatures(SOURCE_IDS.EVENTS_VECTOR_SOURCE, { sourceLayer: SOURCE_LAYER });
    const overlayIds = overlayIdsRef.current;
    const timeSliderParams = timeSliderRef.current;

    // First pass: dedupe by id + apply the overlay-id exclusion and the time-slider hide WITHOUT
    // normalizing yet, so we can short-circuit before the normalize + setState when nothing changed.
    const seen = new Set();
    const survivors = [];
    for (const feature of raw) {
      const id = feature.properties?.id;

      if (!id || seen.has(id)) {
        continue;
      }

      seen.add(id);

      if (overlayIds.has(id) || !isFeatureVisibleAtVirtualDate(feature, timeSliderParams)) {
        continue;
      }

      survivors.push(feature);
    }

    if (!survivors.length) {
      publishEmpty();
      return;
    }

    const signature = `${inputsVersionRef.current}|${survivors.map((feature) => feature.properties.id).sort().join(',')}`;
    if (signature === lastSignatureRef.current) {
      // Same events as last publish.
      return;
    }

    lastSignatureRef.current = signature;

    const valueMap = eventTypeValueMapRef.current;
    setTileFeatures(featureCollection(survivors.map((feature) => normalizeTileEventFeature(feature, valueMap))));
  }, [map, publishEmpty]);

  useEffect(() => {
    enabledRef.current = useEventVectorTiles;
    eventTypeValueMapRef.current = eventTypeValueMap;
    inputsVersionRef.current += 1;
    overlayIdsRef.current = new Set(realtimeOverlayFeatureIds);
    timeSliderRef.current = timeSliderParameters;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    recompute();
  }, [useEventVectorTiles, realtimeOverlayFeatureIds, timeSliderParameters, eventTypeValueMap, recompute]);

  useEffect(() => {
    if (map && useEventVectorTiles) {
      const onSourceData = (event) => {
        if (event.sourceId === SOURCE_IDS.EVENTS_VECTOR_SOURCE) {
          recompute();
        }
      };

      map.on('sourcedata', onSourceData);
      map.on('moveend', recompute);

      // eslint-disable-next-line react-hooks/set-state-in-effect
      recompute();

      return () => {
        map.off('sourcedata', onSourceData);
        map.off('moveend', recompute);
      };
    }
  }, [map, useEventVectorTiles, recompute]);

  return (
    <TileEventFeaturesContext.Provider value={tileFeatures}>
      {children}
    </TileEventFeaturesContext.Provider>
  );
};

export default TileEventFeaturesProvider;
