import { featureCollection, point, polygon } from '@turf/turf';

import { selectRealtimeOverlayFeatureIds, selectRealtimeOverlayFeatureCollection } from './';

describe('Selectors - Events realtime overlay', () => {
  const eventTypes = [{ display: 'Type 1', value: 'type1' }];

  const eventStore = {
    p1: { id: 'p1', state: 'active', event_type: 'type1', priority: 0, geojson: point([10, 10]) },
    p2: { id: 'p2', state: 'resolved', event_type: 'type1', priority: 0, geojson: point([20, 20]) },
    p3: { id: 'p3', state: 'active', event_type: 'type1', priority: 0, geojson: point([30, 30]) },
    poly1: {
      id: 'poly1', state: 'active', event_type: 'type1', priority: 0,
      geojson: polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]),
    },
  };

  const activeFilter = {
    state: ['active'],
    filter: { date_range: {}, event_type: [], priority: [], reported_by: [], text: '' },
  };

  const buildState = ({ overlayEventIds = {}, locallyEditedEvent = null, eventFilter = activeFilter } = {}) => ({
    data: {
      eventFilter,
      eventStore,
      eventTypes,
      locallyEditedEvent,
      realtimeOverlayEvents: { ids: overlayEventIds },
    },
  });

  describe('selectRealtimeOverlayFeatureCollection', () => {
    test('builds the feature collection from the realtime overlay events that match the filter', () => {
      const state = buildState({ overlayEventIds: { p1: 1, p3: 1 } });

      expect(selectRealtimeOverlayFeatureCollection(state)).toEqual(featureCollection([{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [10, 10] },
        properties: { id: 'p1', state: 'active', event_type: 'type1', priority: 0, display_title: 'Type 1' },
      }, {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [30, 30] },
        properties: { id: 'p3', state: 'active', event_type: 'type1', priority: 0, display_title: 'Type 1' },
      }]));
    });

    test('excludes the events that do not match the filter', () => {
      const state = buildState({ overlayEventIds: { p2: 1 } });

      expect(selectRealtimeOverlayFeatureCollection(state)).toEqual(featureCollection([]));
    });

    test('includes the locally edited event if it is in the event store', () => {
      const state = buildState({ locallyEditedEvent: { id: 'p1', priority: 300 } });

      expect(selectRealtimeOverlayFeatureCollection(state)).toEqual(featureCollection([{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [10, 10] },
        properties: {
          id: 'p1', state: 'active', event_type: 'type1', priority: 300, locallyEdited: true, display_title: '* Type 1',
        },
      }]));
    });

    test('excludes the locally edited event if it is not in the event store', () => {
      const state = buildState({ locallyEditedEvent: { id: 'ghost', priority: 300 } });

      expect(selectRealtimeOverlayFeatureCollection(state)).toEqual(featureCollection([]));
    });

    test('excludes polygon events', () => {
      const state = buildState({ overlayEventIds: { p1: 1, poly1: 1 } });

      expect(selectRealtimeOverlayFeatureCollection(state)).toEqual(featureCollection([{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [10, 10] },
        properties: { id: 'p1', state: 'active', event_type: 'type1', priority: 0, display_title: 'Type 1' },
      }]));
    });
  });

  describe('selectRealtimeOverlayFeatureIds', () => {
    test('maps the feature collection to the ids of the features', () => {
      const state = buildState({ overlayEventIds: { p1: 1, p3: 1 } });

      expect(selectRealtimeOverlayFeatureIds(state)).toEqual(['p1', 'p3']);
    });
  });
});
