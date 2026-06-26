import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';

import EventsVectorLayer, { buildEventTileUrl } from './';
import { MapContext } from '../MapContext';
import { createMapMock } from '../__test-helpers/mocks';
import { calcEventFilterForRequest } from '../utils/event-filter';
import { objectToParamString } from '../utils/query';
import { selectRealtimeOverlayFeatureIds } from '../selectors/events-realtime-overlay';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../selectors/events-realtime-overlay', () => ({
  selectRealtimeOverlayFeatureIds: jest.fn(() => []),
}));

// Identity HOC so we don't need a redux Provider for the connect() wrapper.
jest.mock('../WithMapViewConfig', () => (Component) => function MockWithMapViewConfig(props) {
  return <Component mapUserLayoutConfig={{}} mapUserLayoutConfigByLayerId={() => ({})} {...props} />;
});

jest.mock('../utils/map', () => ({
  safeRemoveMapLayer: jest.fn(),
  safeRemoveMapSource: jest.fn(),
}));

// Bypass the multi-layer guard so the inner click handler always fires.
jest.mock('../utils/map-handlers', () => ({
  withMultiLayerHandlerAwareness: (_map, fn) => fn,
}));

jest.mock('../utils/event-filter', () => ({
  calcEventFilterForRequest: jest.fn(),
}));

jest.mock('../utils/query', () => ({
  objectToParamString: jest.fn(),
}));

const buildState = (overrides = {}) => ({
  data: {
    token: { access_token: 'mock-token' },
    eventFilter: {
      state: ['active'],
      filter: { date_range: {}, event_type: [], priority: [], reported_by: [], text: '' },
    },
    eventTypes: [{ value: 'fire', icon_id: 'fire' }],
    eventStore: { 'evt-1': { id: 'evt-1', event_type: 'fire', title: 'Fire' } },
    mapLayerFilter: { showReportsOnMap: true },
    realtimeOverlayEvents: { ids: {} },
    ...overrides.data,
  },
  view: {
    mapClusterConfig: { data: { events: false, subjects: false } },
    timeSliderState: { active: false, virtualDate: null },
    ...overrides.view,
  },
});

const renderLayer = (props = {}) => render(
  <MapContext.Provider value={props.map}>
    <EventsVectorLayer onEventClick={props.onEventClick} />
  </MapContext.Provider>
);

describe('EventsVectorLayer', () => {
  let mockMap;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMap = createMapMock();
    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);
    mockMap.getCanvas.mockReturnValue({ style: {} });

    calcEventFilterForRequest.mockReturnValue({ state: ['active'], filter: {}, sort_by: '-updated_at' });
    objectToParamString.mockReturnValue('state=active&filter=%7B%7D');
    selectRealtimeOverlayFeatureIds.mockReturnValue([]);

    useSelector.mockImplementation((selector) => selector(buildState()));
  });

  describe('buildEventTileUrl', () => {
    test('targets the events tile endpoint and drops sort_by/bbox', () => {
      calcEventFilterForRequest.mockReturnValue({
        state: ['active'], filter: {}, sort_by: '-updated_at', bbox: '1,2,3,4',
      });
      objectToParamString.mockImplementation((obj) => {
        expect(obj.sort_by).toBeUndefined();
        expect(obj.bbox).toBeUndefined();
        return 'state=active';
      });

      const url = buildEventTileUrl();

      expect(url).toContain('activity/events/tiles/{z}/{x}/{y}.pbf');
      expect(url).toContain('?state=active');
    });
  });

  describe('source + layers', () => {
    test('adds a vector source for the events tile endpoint (auth is map-wide, not per-source)', () => {
      renderLayer({ map: mockMap, onEventClick: jest.fn() });

      const addSourceCall = mockMap.addSource.mock.calls.find((c) => c[0] === 'events-vector-source');
      expect(addSourceCall).toBeDefined();

      const sourceConfig = addSourceCall[1];
      expect(sourceConfig.type).toBe('vector');
      expect(sourceConfig.tiles[0]).toContain('activity/events/tiles/{z}/{x}/{y}.pbf');
      // Bearer token is attached by the map-wide transformRequest (EarthRangerMap).
      expect(sourceConfig.transformRequest).toBeUndefined();
    });

    test('adds the symbol + labels layers on the events source-layer', () => {
      renderLayer({ map: mockMap, onEventClick: jest.fn() });

      const symbolCall = mockMap.addLayer.mock.calls.find((c) => c[0].id === 'events-vector-symbols');
      expect(symbolCall[0]).toEqual(expect.objectContaining({
        type: 'symbol',
        source: 'events-vector-source',
        'source-layer': 'events',
      }));

      const labelsCall = mockMap.addLayer.mock.calls.find((c) => c[0].id === 'events-vector-symbols-labels');
      expect(labelsCall[0]['source-layer']).toBe('events');
    });

    test('removes its layers and source on unmount', () => {
      const { safeRemoveMapLayer, safeRemoveMapSource } = require('../utils/map');
      const { unmount } = renderLayer({ map: mockMap, onEventClick: jest.fn() });

      unmount();

      expect(safeRemoveMapLayer).toHaveBeenCalledWith(mockMap, 'events-vector-symbols');
      expect(safeRemoveMapLayer).toHaveBeenCalledWith(mockMap, 'events-vector-symbols-labels');
      expect(safeRemoveMapSource).toHaveBeenCalledWith(mockMap, 'events-vector-source');
    });
  });

  describe('overlay exclusion', () => {
    test('excludes overlay-owned ids from the tile layers', () => {
      mockMap.getLayer.mockReturnValue({ id: 'exists' });
      selectRealtimeOverlayFeatureIds.mockReturnValue(['evt-9']);

      renderLayer({ map: mockMap, onEventClick: jest.fn() });

      const filterCall = mockMap.setFilter.mock.calls.find(([layerId]) => layerId === 'events-vector-symbols');
      expect(filterCall).toBeDefined();
      expect(filterCall[1]).toEqual(['!', ['in', ['get', 'id'], ['literal', ['evt-9']]]]);
    });

    test('clears the tile filter when there are no overlay ids', () => {
      mockMap.getLayer.mockReturnValue({ id: 'exists' });

      renderLayer({ map: mockMap, onEventClick: jest.fn() });

      const filterCall = mockMap.setFilter.mock.calls.find(([layerId]) => layerId === 'events-vector-symbols');
      expect(filterCall[1]).toBeNull();
    });
  });

  describe('time slider', () => {
    const activeSliderState = {
      data: {
        eventFilter: {
          state: ['active'],
          filter: {
            date_range: { lower: '2026-06-01T00:00:00.000Z', upper: '2026-06-25T00:00:00.000Z' },
            event_type: [], priority: [], reported_by: [], text: '',
          },
        },
      },
      view: { timeSliderState: { active: true, virtualDate: '2026-06-20T00:00:00.000Z' } },
    };

    test('hides events after the virtual date via setFilter on both layers', () => {
      mockMap.getLayer.mockReturnValue({ id: 'exists' });
      useSelector.mockImplementation((selector) => selector(buildState(activeSliderState)));

      renderLayer({ map: mockMap, onEventClick: jest.fn() });

      const hide = ['<=', ['coalesce', ['get', 'event_time_iso'], ''], '2026-06-20T00:00:00.000Z'];
      expect(mockMap.setFilter).toHaveBeenCalledWith('events-vector-symbols', hide);
      expect(mockMap.setFilter).toHaveBeenCalledWith('events-vector-symbols-labels', hide);
    });

    test('composes the overlay exclusion with the time-slider hide', () => {
      mockMap.getLayer.mockReturnValue({ id: 'exists' });
      selectRealtimeOverlayFeatureIds.mockReturnValue(['evt-9']);
      useSelector.mockImplementation((selector) => selector(buildState(activeSliderState)));

      renderLayer({ map: mockMap, onEventClick: jest.fn() });

      const filterCall = mockMap.setFilter.mock.calls.find(([layerId]) => layerId === 'events-vector-symbols');
      expect(filterCall[1]).toEqual([
        'all',
        ['!', ['in', ['get', 'id'], ['literal', ['evt-9']]]],
        ['<=', ['coalesce', ['get', 'event_time_iso'], ''], '2026-06-20T00:00:00.000Z'],
      ]);
    });

    test('fades the label pill via an interpolation when the slider is active', () => {
      mockMap.getLayer.mockReturnValue({ id: 'exists' });
      useSelector.mockImplementation((selector) => selector(buildState(activeSliderState)));

      renderLayer({ map: mockMap, onEventClick: jest.fn() });

      const paintCall = mockMap.setPaintProperty.mock.calls.find(
        ([layerId, prop]) => layerId === 'events-vector-symbols-labels' && prop === 'icon-color'
      );
      expect(paintCall).toBeDefined();
      expect(Array.isArray(paintCall[2])).toBe(true);
      // Guarded interpolate: ['case', ['has','event_time_ms'], <interpolate>, default].
      expect(paintCall[2][0]).toBe('case');
      expect(paintCall[2][2][0]).toBe('interpolate');
    });

    test('uses the default label color when the slider is off', () => {
      mockMap.getLayer.mockReturnValue({ id: 'exists' });

      renderLayer({ map: mockMap, onEventClick: jest.fn() });

      const paintCall = mockMap.setPaintProperty.mock.calls.find(
        ([layerId, prop]) => layerId === 'events-vector-symbols-labels' && prop === 'icon-color'
      );
      expect(paintCall[2]).toBe('rgba(255, 255, 255, 0.7)');
    });
  });

  describe('visibility', () => {
    const matchNothing = ['in', ['get', 'id'], ['literal', []]];

    test('renders nothing via a match-nothing filter when "show events on map" is off', () => {
      mockMap.getLayer.mockReturnValue({ id: 'exists' });
      useSelector.mockImplementation((selector) => selector(
        buildState({ data: { mapLayerFilter: { showReportsOnMap: false } } })
      ));

      renderLayer({ map: mockMap, onEventClick: jest.fn() });

      expect(mockMap.setFilter).toHaveBeenCalledWith('events-vector-symbols', matchNothing);
      expect(mockMap.setFilter).toHaveBeenCalledWith('events-vector-symbols-labels', matchNothing);
    });

    test('renders nothing via a match-nothing filter while clustering', () => {
      mockMap.getLayer.mockReturnValue({ id: 'exists' });
      useSelector.mockImplementation((selector) => selector(
        buildState({ view: { mapClusterConfig: { data: { events: true, subjects: false } }, timeSliderState: { active: false, virtualDate: null } } })
      ));

      renderLayer({ map: mockMap, onEventClick: jest.fn() });

      expect(mockMap.setFilter).toHaveBeenCalledWith('events-vector-symbols', matchNothing);
      expect(mockMap.setFilter).toHaveBeenCalledWith('events-vector-symbols-labels', matchNothing);
    });

    test('applies the real overlay-exclusion filter (not match-nothing) when reports are on and not clustering', () => {
      mockMap.getLayer.mockReturnValue({ id: 'exists' });

      renderLayer({ map: mockMap, onEventClick: jest.fn() });

      const symbolsFilterCalls = mockMap.setFilter.mock.calls.filter(([id]) => id === 'events-vector-symbols');
      const lastFilter = symbolsFilterCalls.at(-1)?.[1];
      expect(lastFilter).not.toEqual(matchNothing);
    });
  });

  describe('click handling', () => {
    const getClickHandler = () => mockMap.on.mock.calls.find(
      ([type, layerId]) => type === 'click' && layerId === 'events-vector-symbols'
    )?.[2];

    beforeEach(() => {
      mockMap.getSource.mockReturnValue({ type: 'vector' });
      mockMap.getLayer.mockReturnValue({ id: 'exists' });
    });

    test('hydrates the clicked feature from the event store', () => {
      const onEventClick = jest.fn();
      mockMap.queryRenderedFeatures.mockReturnValue([
        { properties: { id: 'evt-1', event_type_value: 'fire' } },
      ]);

      renderLayer({ map: mockMap, onEventClick });
      getClickHandler()({ point: { x: 1, y: 1 } });

      expect(onEventClick).toHaveBeenCalledTimes(1);
      expect(onEventClick.mock.calls[0][0].layer.properties).toEqual(
        buildState().data.eventStore['evt-1']
      );
    });

    test('falls back to flat tile properties when the id is not in the store', () => {
      const onEventClick = jest.fn();
      useSelector.mockImplementation((selector) => selector(buildState({ data: { eventStore: {} } })));
      mockMap.queryRenderedFeatures.mockReturnValue([
        { properties: { id: 'unknown', event_type_value: 'fire', title: 'Fire' } },
      ]);

      renderLayer({ map: mockMap, onEventClick });
      getClickHandler()({ point: { x: 1, y: 1 } });

      expect(onEventClick).toHaveBeenCalledTimes(1);
      expect(onEventClick.mock.calls[0][0].layer.properties.event_type).toBe('fire');
    });

    test('fires onEventClick once even though bound to both the icon and label layers', () => {
      const onEventClick = jest.fn();
      mockMap.queryRenderedFeatures.mockReturnValue([
        { properties: { id: 'evt-1', event_type_value: 'fire' } },
      ]);

      renderLayer({ map: mockMap, onEventClick });

      const clickHandlers = mockMap.on.mock.calls
        .filter(([type, layerId]) => type === 'click'
          && ['events-vector-symbols', 'events-vector-symbols-labels'].includes(layerId))
        .map((call) => call[2]);
      expect(clickHandlers).toHaveLength(2);

      // A single physical click dispatches to both layer bindings — must open the event once.
      clickHandlers.forEach((handler) => handler({ point: { x: 1, y: 1 } }));

      expect(onEventClick).toHaveBeenCalledTimes(1);
    });
  });
});
