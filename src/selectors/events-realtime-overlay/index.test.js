import { featureCollection, point, polygon } from '@turf/turf';

import { formatEventSymbolDate } from '../../utils/datetime';
import {
  selectRealtimeOverlayFeatureCollection,
  selectRealtimeOverlayFeatureIds,
  selectRealtimeOverlayPolygonFeatureCollection,
} from './';

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
    polyEmpty: {
      id: 'polyEmpty', state: 'active', event_type: 'type1', priority: 0,
      geojson: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [] } },
    },
    p4: {
      id: 'p4', state: 'active', event_type: 'type1', priority: 0,
      geojson: point([40, 40]), time: '2026-06-20T12:30:00.000Z',
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

    test('represents polygon events as their centroid (a Point) so they render an icon + cluster', () => {
      const state = buildState({ overlayEventIds: { p1: 1, poly1: 1 } });

      const { features } = selectRealtimeOverlayFeatureCollection(state);
      expect(features).toHaveLength(2);
      features.forEach((feature) => expect(feature.geometry.type).toBe('Point'));

      const centroid = features.find((feature) => feature.properties.id === 'poly1');
      expect(centroid.geometry.coordinates).toEqual([0.5, 0.5]);
      expect(centroid.properties).toMatchObject({ id: 'poly1', event_type: 'type1', display_title: 'Type 1' });
    });

    test('skips a polygon with no usable interior point instead of anchoring it at [0,0]', () => {
      const state = buildState({ overlayEventIds: { p1: 1, polyEmpty: 1 } });

      const { features } = selectRealtimeOverlayFeatureCollection(state);
      expect(features.map((feature) => feature.properties.id)).toEqual(['p1']);
    });

    test('includes event_time_iso and event_time_ms on the rendered features for the time slider', () => {
      const state = buildState({ overlayEventIds: { p4: 1 } });

      expect(selectRealtimeOverlayFeatureCollection(state)).toEqual(featureCollection([{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [40, 40] },
        properties: {
          id: 'p4',
          state: 'active',
          event_type: 'type1',
          priority: 0,
          time: '2026-06-20T12:30:00.000Z',
          display_title: `Type 1\n${formatEventSymbolDate('2026-06-20T12:30:00.000Z')}`,
          event_time_iso: '2026-06-20T12:30:00.000Z',
          event_time_ms: new Date('2026-06-20T12:30:00.000Z').getTime(),
        },
      }]));
    });
  });

  describe('selectRealtimeOverlayPolygonFeatureCollection', () => {
    test('includes only the polygon features (for the fill layer)', () => {
      const state = buildState({ overlayEventIds: { p1: 1, poly1: 1 } });

      const { features } = selectRealtimeOverlayPolygonFeatureCollection(state);
      expect(features).toHaveLength(1);
      expect(features[0].geometry.type).toBe('Polygon');
      expect(features[0].properties.id).toBe('poly1');
    });

    test('is empty when there are no polygon overlay events', () => {
      const state = buildState({ overlayEventIds: { p1: 1, p3: 1 } });

      expect(selectRealtimeOverlayPolygonFeatureCollection(state)).toEqual(featureCollection([]));
    });
  });

  describe('selectRealtimeOverlayFeatureIds', () => {
    test('maps the feature collection to the ids of the features', () => {
      const state = buildState({ overlayEventIds: { p1: 1, p3: 1 } });

      expect(selectRealtimeOverlayFeatureIds(state)).toEqual(['p1', 'p3']);
    });

    test('includes polygon event ids (carried by their centroid) so the tile excludes them', () => {
      const state = buildState({ overlayEventIds: { p1: 1, poly1: 1 } });

      expect(selectRealtimeOverlayFeatureIds(state)).toEqual(expect.arrayContaining(['p1', 'poly1']));
    });
  });
});
