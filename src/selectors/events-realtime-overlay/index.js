import { featureCollection } from '@turf/turf';
import { createSelector } from 'reselect';
import { shallowEqual } from 'react-redux';

import { applyLocalEditsToEvent } from '../../utils/locally-edited-event';
import { createFeatureCollectionFromEvents } from '../../utils/map';
import { interiorPointOnSurface } from '../../utils/event-vector-tiles';
import { selectLocallyEditedEventFromStore } from '../locally-edited-event';
import { validateReportAgainstCurrentEventFilter } from '../../utils/events';

const addEventTimeFieldsToFeature = (feature) => {
  const time = feature?.properties?.time;
  const date = time ? new Date(time) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return feature;
  }
  return {
    ...feature,
    properties: {
      ...feature.properties,
      event_time_iso: date.toISOString(),
      event_time_ms: date.getTime(),
    },
  };
};

const selectEventFilter = (state) => state.data.eventFilter;
const selectEventStore = (state) => state.data.eventStore;
const selectEventTypes = (state) => state.data.eventTypes;
const selectLocallyEditedEvent = (state) => state.data.locallyEditedEvent;
const selectRealtimeOverlayEventIds = (state) => state.data.realtimeOverlayEvents.ids;
const selectRealtimeOverlayHiddenEventIds = (state) => state.data.realtimeOverlayEvents.hiddenIds;

const selectRealtimeOverlayEvents = createSelector(
  [selectRealtimeOverlayEventIds, selectEventStore],
  (realtimeOverlayEventIds, eventStore) => Object.keys(realtimeOverlayEventIds)
    .map((id) => eventStore[id]).filter(Boolean),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
);

const selectRealtimeOverlayFeatures = createSelector(
  [
    selectRealtimeOverlayEvents,
    selectLocallyEditedEventFromStore,
    selectEventTypes,
    selectLocallyEditedEvent,
    selectEventFilter,
  ],
  (realtimeOverlayEvents, locallyEditedEventFromStore, eventTypes, locallyEditedEvent, eventFilter) => {
    const filterStore = { getState: () => ({ data: { eventFilter, eventTypes } }) };
    const events = realtimeOverlayEvents
      .filter((event) => event.id !== locallyEditedEvent?.id)
      .filter((event) => validateReportAgainstCurrentEventFilter(event, filterStore));

    if (locallyEditedEvent?.id) {
      events.push(applyLocalEditsToEvent(locallyEditedEventFromStore, locallyEditedEvent));
    }

    return createFeatureCollectionFromEvents(events, eventTypes).features.map(addEventTimeFieldsToFeature);
  }
);

export const selectRealtimeOverlayFeatureCollection = createSelector(
  [selectRealtimeOverlayFeatures],
  (features) => featureCollection(
    features.flatMap((feature) => {
      if (feature.geometry?.type === 'Point') {
        return [feature];
      }
      if (feature.geometry?.type === 'Polygon') {
        const anchor = interiorPointOnSurface(feature);
        if (!anchor) {
          return [];
        }
        return [{ ...anchor, properties: feature.properties }];
      }
      return [];
    })
  )
);

export const selectRealtimeOverlayPolygonFeatureCollection = createSelector(
  [selectRealtimeOverlayFeatures],
  (features) => featureCollection(features.filter((feature) => feature.geometry?.type === 'Polygon'))
);

export const selectRealtimeOverlayFeatureIds = createSelector(
  [selectRealtimeOverlayFeatureCollection],
  (realtimeOverlayFeatureCollection) => realtimeOverlayFeatureCollection.features
    .map((feature) => feature.properties.id),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
);

export const selectTileExcludedEventIds = createSelector(
  [selectRealtimeOverlayFeatureIds, selectRealtimeOverlayHiddenEventIds],
  (overlayFeatureIds, realtimeOverlayHiddenEventIds) => {
    const hiddenIdKeys = Object.keys(realtimeOverlayHiddenEventIds ?? {});
    if (!hiddenIdKeys.length) {
      return overlayFeatureIds;
    }
    return Array.from(new Set([...overlayFeatureIds, ...hiddenIdKeys]));
  },
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
);
