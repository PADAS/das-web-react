import { createSelector } from 'reselect';
import { featureCollection } from '@turf/turf';
import { shallowEqual } from 'react-redux';

import { applyLocalEditsToEvent } from '../../utils/locally-edited-event';
import { createFeatureCollectionFromEvents } from '../../utils/map';
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

const selectRealtimeOverlayEvents = createSelector(
  [selectRealtimeOverlayEventIds, selectEventStore],
  (realtimeOverlayEventIds, eventStore) => Object.keys(realtimeOverlayEventIds)
    .map((id) => eventStore[id]).filter(Boolean),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
);

export const selectRealtimeOverlayFeatureCollection = createSelector(
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

    return featureCollection(
      createFeatureCollectionFromEvents(events, eventTypes).features
        .filter((feature) => feature.geometry?.type === 'Point')
        .map(addEventTimeFieldsToFeature)
    );
  }
);

export const selectRealtimeOverlayFeatureIds = createSelector(
  [selectRealtimeOverlayFeatureCollection],
  (realtimeOverlayFeatureCollection) => realtimeOverlayFeatureCollection.features
    .map((feature) => feature.properties.id),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } }
);
