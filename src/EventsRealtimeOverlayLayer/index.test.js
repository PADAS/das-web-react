import React from 'react';
import { featureCollection, point, polygon } from '@turf/turf';
import { render } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';

import { ADD_EVENT, CLEAR_HIDDEN_EVENTS, PRUNE_EVENTS } from '../ducks/events-realtime-overlay';
import { createMapMock } from '../__test-helpers/mocks';
import { fetchRecentEventsIntoRealtimeOverlay } from '../ducks/events';
import {
  selectRealtimeOverlayFeatureCollection,
  selectRealtimeOverlayPolygonFeatureCollection,
} from '../selectors/events-realtime-overlay';
import { selectShouldEventsBeClustered } from '../selectors/clusters';
import { LAYER_IDS, SOURCE_IDS } from '../constants';
import { MapContext } from '../MapContext';

import EventsRealtimeOverlayLayer from './';

jest.mock('../ducks/events', () => ({ fetchRecentEventsIntoRealtimeOverlay: jest.fn() }));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../selectors/clusters', () => ({
  selectShouldEventsBeClustered: jest.fn(() => false),
}));

// Capture the props the overlay hands to the shared label component.
let labeledSymbolLayerProps;
jest.mock('../LabeledSymbolLayer', () => (props) => {
  labeledSymbolLayerProps = props;
  return null;
});

jest.mock('../selectors/events-realtime-overlay', () => ({
  selectRealtimeOverlayFeatureCollection: jest.fn(),
  selectRealtimeOverlayPolygonFeatureCollection: jest.fn(),
}));

// Bypass the multi-layer guard so the inner click handler always fires.
jest.mock('../utils/map-handlers', () => ({
  withMultiLayerHandlerAwareness: (_map, fn) => fn,
}));

const OVERLAY_FC = featureCollection([point([0, 0], { id: 'evt-1' })]);
const OVERLAY_POLYGON_FC = featureCollection([]);

const renderOverlay = (map, showReportsOnMap = true, locallyEditedEventId) => {
  useSelector.mockImplementation((selector) => {
    if (selector === selectRealtimeOverlayFeatureCollection) return OVERLAY_FC;
    if (selector === selectRealtimeOverlayPolygonFeatureCollection) return OVERLAY_POLYGON_FC;
    return selector({
      data: {
        mapLayerFilter: { showReportsOnMap },
        locallyEditedEvent: locallyEditedEventId ? { id: locallyEditedEventId } : null,
      },
    });
  });

  return render(
    <MapContext.Provider value={map}>
      <EventsRealtimeOverlayLayer onEventClick={jest.fn()} />
    </MapContext.Provider>
  );
};

describe('EventsRealtimeOverlayLayer', () => {
  let mockMap;
  let dispatch;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockMap = createMapMock();
    mockMap.getLayer.mockReturnValue({ id: 'exists' });
    dispatch = jest.fn();
    useDispatch.mockReturnValue(dispatch);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('creates the overlay source as an empty GeoJSON source (data flows through setData)', () => {
    mockMap.getSource.mockReturnValue(undefined);

    renderOverlay(mockMap, true);

    const [, sourceConfig] = mockMap.addSource.mock.calls.at(-1);
    expect(sourceConfig.type).toBe('geojson');
    expect(sourceConfig.data.features).toHaveLength(0);
  });

  test('pushes the overlay feature collection via setData when reports are shown', () => {
    const setData = jest.fn();
    mockMap.getSource.mockReturnValue({ setData });

    renderOverlay(mockMap, true);

    expect(setData).toHaveBeenCalledWith(OVERLAY_FC);
  });

  test('pushes an empty collection via setData when reports are hidden', () => {
    const setData = jest.fn();
    mockMap.getSource.mockReturnValue({ setData });

    renderOverlay(mockMap, false);

    expect(setData.mock.calls.at(-1)[0].features).toHaveLength(0);
  });

  test('pushes new overlay data via setData without recreating the source', () => {
    const setData = jest.fn();
    // Source already exists, so creation is skipped and updates go through setData.
    mockMap.getSource.mockReturnValue({ setData });
    const initialFC = featureCollection([]);
    useSelector.mockImplementation((selector) => (
      selector === selectRealtimeOverlayFeatureCollection
        ? initialFC
        : selector({ data: { mapLayerFilter: { showReportsOnMap: true }, locallyEditedEvent: null } })
    ));

    const { rerender } = render(
      <MapContext.Provider value={mockMap}>
        <EventsRealtimeOverlayLayer onEventClick={jest.fn()} />
      </MapContext.Provider>
    );

    expect(mockMap.addSource).not.toHaveBeenCalled();

    useSelector.mockImplementation((selector) => (
      selector === selectRealtimeOverlayFeatureCollection
        ? OVERLAY_FC
        : selector({ data: { mapLayerFilter: { showReportsOnMap: true }, locallyEditedEvent: null } })
    ));
    rerender(
      <MapContext.Provider value={mockMap}>
        <EventsRealtimeOverlayLayer onEventClick={jest.fn()} />
      </MapContext.Provider>
    );

    expect(setData).toHaveBeenCalledWith(OVERLAY_FC);
  });

  test('removes the overlay layers before the source on unmount', () => {
    mockMap.getSource.mockReturnValue({ setData: jest.fn() });
    mockMap.getLayer.mockReturnValue({ id: 'exists' });

    const removalOrder = [];
    mockMap.removeLayer.mockImplementation((id) => removalOrder.push(`layer:${id}`));
    mockMap.removeSource.mockImplementation((id) => removalOrder.push(`source:${id}`));

    const { unmount } = renderOverlay(mockMap, true);
    unmount();

    // Each source must be removed only after the layers that reference it.
    const order = (entry) => removalOrder.indexOf(entry);

    expect(mockMap.removeSource).toHaveBeenCalledWith(SOURCE_IDS.EVENTS_REALTIME_OVERLAY_SOURCE);
    expect(order(`layer:${LAYER_IDS.EVENTS_REALTIME_OVERLAY_SYMBOLS}-labels`))
      .toBeLessThan(order(`source:${SOURCE_IDS.EVENTS_REALTIME_OVERLAY_SOURCE}`));
    expect(order(`layer:${LAYER_IDS.EVENTS_REALTIME_OVERLAY_SYMBOLS}`))
      .toBeLessThan(order(`source:${SOURCE_IDS.EVENTS_REALTIME_OVERLAY_SOURCE}`));

    expect(mockMap.removeSource).toHaveBeenCalledWith(SOURCE_IDS.EVENTS_REALTIME_OVERLAY_POLYGON_SOURCE);
    expect(order(`layer:${LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY}`))
      .toBeLessThan(order(`source:${SOURCE_IDS.EVENTS_REALTIME_OVERLAY_POLYGON_SOURCE}`));
  });

  test('renders the labeled symbol layer on the overlay source', () => {
    renderOverlay(mockMap, true);

    expect(labeledSymbolLayerProps.id).toBe('event_symbols-realtime-overlay');
    expect(labeledSymbolLayerProps.sourceId).toBe('events-realtime-overlay-source');
  });

  test('periodically prunes stale overlay membership', () => {
    renderOverlay(mockMap, true);

    jest.advanceTimersByTime(60 * 1000);

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: PRUNE_EVENTS }));
  });

  test('clears hidden (delete-instant) ids only once the tile has reloaded under the new filter', () => {
    const setSelector = (eventFilter) => useSelector.mockImplementation((selector) => {
      if (selector === selectRealtimeOverlayFeatureCollection) return OVERLAY_FC;
      if (selector === selectRealtimeOverlayPolygonFeatureCollection) return OVERLAY_POLYGON_FC;
      return selector({ data: { eventFilter, mapLayerFilter: { showReportsOnMap: true }, locallyEditedEvent: null } });
    });

    setSelector({ state: ['active'] });
    const { rerender } = render(
      <MapContext.Provider value={mockMap}><EventsRealtimeOverlayLayer onEventClick={jest.fn()} /></MapContext.Provider>
    );

    dispatch.mockClear();
    setSelector({ state: ['active', 'resolved'] }); // a new filter reference
    rerender(
      <MapContext.Provider value={mockMap}><EventsRealtimeOverlayLayer onEventClick={jest.fn()} /></MapContext.Provider>
    );

    mockMap.__test__.fireHandlers('sourcedata', { sourceId: SOURCE_IDS.EVENTS_VECTOR_SOURCE });
    expect(dispatch).not.toHaveBeenCalledWith({ type: CLEAR_HIDDEN_EVENTS });

    jest.advanceTimersByTime(400);

    mockMap.__test__.fireHandlers('sourcedata', { sourceId: 'some-other-source' });
    expect(dispatch).not.toHaveBeenCalledWith({ type: CLEAR_HIDDEN_EVENTS });

    mockMap.__test__.fireHandlers('sourcedata', { sourceId: SOURCE_IDS.EVENTS_VECTOR_SOURCE });
    expect(dispatch).toHaveBeenCalledWith({ type: CLEAR_HIDDEN_EVENTS });
  });

  test('keeps the locally edited event in overlay membership so it does not hand back to the tile', () => {
    renderOverlay(mockMap, true, 'evt-7');

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: ADD_EVENT,
      payload: expect.objectContaining({ id: 'evt-7' }),
    }));
  });

  describe('time slider', () => {
    test('passes an all-pass filter and the default label color when the slider is off', () => {
      renderOverlay(mockMap, true);

      expect(labeledSymbolLayerProps.filter).toEqual(['all']);
      expect(labeledSymbolLayerProps.textPaint).toEqual({ 'icon-color': 'rgba(255, 255, 255, 0.7)' });
    });

    test('passes the hide filter and a fade interpolation when the slider is active', () => {
      useSelector.mockImplementation((selector) => (
        selector === selectRealtimeOverlayFeatureCollection
          ? OVERLAY_FC
          : selector({
            data: {
              mapLayerFilter: { showReportsOnMap: true },
              locallyEditedEvent: null,
              eventFilter: { filter: { date_range: { lower: '2026-06-01T00:00:00.000Z', upper: '2026-06-25T00:00:00.000Z' } } },
            },
            view: { timeSliderState: { active: true, virtualDate: '2026-06-20T00:00:00.000Z' } },
          })
      ));

      render(
        <MapContext.Provider value={mockMap}>
          <EventsRealtimeOverlayLayer onEventClick={jest.fn()} />
        </MapContext.Provider>
      );

      expect(labeledSymbolLayerProps.filter).toEqual(
        ['<=', ['coalesce', ['get', 'event_time_iso'], ''], '2026-06-20T00:00:00.000Z']
      );
      // Guarded interpolate: ['case', ['has','event_time_ms'], <interpolate>, default].
      expect(labeledSymbolLayerProps.textPaint['icon-color'][0]).toBe('case');
      expect(labeledSymbolLayerProps.textPaint['icon-color'][2][0]).toBe('interpolate');
    });
  });

  describe('recent events fetching into realtime overlay', () => {
    test('fetches the recent window on mount (debounced) and on moveend', () => {
      fetchRecentEventsIntoRealtimeOverlay.mockReturnValue({ type: 'FETCH_RECENT_OVERLAY_EVENTS' });

      renderOverlay(mockMap, true);
      jest.advanceTimersByTime(400);
      expect(dispatch).toHaveBeenCalledWith({ type: 'FETCH_RECENT_OVERLAY_EVENTS' });

      dispatch.mockClear();
      mockMap.__test__.fireHandlers('moveend', {});
      jest.advanceTimersByTime(400);
      expect(dispatch).toHaveBeenCalledWith({ type: 'FETCH_RECENT_OVERLAY_EVENTS' });
    });
  });

  describe('overlay symbol visibility while clustering', () => {
    test('hides the overlay symbol layers (via layout) when clustering is active', () => {
      selectShouldEventsBeClustered.mockReturnValue(true);

      renderOverlay(mockMap, true);

      expect(labeledSymbolLayerProps.layout.visibility).toBe('none');
      expect(labeledSymbolLayerProps.textLayout.visibility).toBe('none');
    });

    test('shows the overlay symbol layers (via layout) when clustering is off', () => {
      selectShouldEventsBeClustered.mockReturnValue(false);

      renderOverlay(mockMap, true);

      expect(labeledSymbolLayerProps.layout.visibility).toBe('visible');
      expect(labeledSymbolLayerProps.textLayout.visibility).toBe('visible');
    });
  });

  describe('overlay polygon fill', () => {
    test('creates the polygon source + fill layer and pushes polygon data via setData', () => {
      const polygonSetData = jest.fn();
      const polygonFC = featureCollection([polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]], { id: 'poly-1' })]);

      mockMap.getLayer.mockReturnValue(null);
      mockMap.getSource.mockImplementation((id) => (
        id === SOURCE_IDS.EVENTS_REALTIME_OVERLAY_POLYGON_SOURCE
          ? { setData: polygonSetData }
          : { setData: jest.fn() }
      ));

      useSelector.mockImplementation((selector) => {
        if (selector === selectRealtimeOverlayFeatureCollection) return OVERLAY_FC;
        if (selector === selectRealtimeOverlayPolygonFeatureCollection) return polygonFC;
        return selector({ data: { mapLayerFilter: { showReportsOnMap: true }, locallyEditedEvent: null } });
      });

      render(
        <MapContext.Provider value={mockMap}>
          <EventsRealtimeOverlayLayer onEventClick={jest.fn()} />
        </MapContext.Provider>
      );

      const fillAddCall = mockMap.addLayer.mock.calls.find((c) => c[0].id === LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY);
      expect(fillAddCall[0]).toEqual(expect.objectContaining({
        type: 'fill',
        source: SOURCE_IDS.EVENTS_REALTIME_OVERLAY_POLYGON_SOURCE,
      }));
      expect(polygonSetData).toHaveBeenCalledWith(polygonFC);
    });

    test('pushes an empty polygon collection when reports are hidden', () => {
      const polygonSetData = jest.fn();
      const polygonFC = featureCollection([polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]], { id: 'poly-1' })]);

      mockMap.getSource.mockImplementation((id) => (
        id === SOURCE_IDS.EVENTS_REALTIME_OVERLAY_POLYGON_SOURCE
          ? { setData: polygonSetData }
          : { setData: jest.fn() }
      ));

      useSelector.mockImplementation((selector) => {
        if (selector === selectRealtimeOverlayFeatureCollection) return OVERLAY_FC;
        if (selector === selectRealtimeOverlayPolygonFeatureCollection) return polygonFC;
        return selector({ data: { mapLayerFilter: { showReportsOnMap: false }, locallyEditedEvent: null } });
      });

      render(
        <MapContext.Provider value={mockMap}>
          <EventsRealtimeOverlayLayer onEventClick={jest.fn()} />
        </MapContext.Provider>
      );

      expect(polygonSetData.mock.calls.at(-1)[0].features).toHaveLength(0);
    });

    test('hides the fill of the polygon being drawn (parity with EventGeometryLayer)', () => {
      const polygonSetData = jest.fn();
      const polygonFC = featureCollection([
        polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]], { id: 'drawing' }),
        polygon([[[5, 5], [5, 6], [6, 6], [6, 5], [5, 5]]], { id: 'other' }),
      ]);

      mockMap.getSource.mockImplementation((id) => (
        id === SOURCE_IDS.EVENTS_REALTIME_OVERLAY_POLYGON_SOURCE
          ? { setData: polygonSetData }
          : { setData: jest.fn() }
      ));

      useSelector.mockImplementation((selector) => {
        if (selector === selectRealtimeOverlayFeatureCollection) return OVERLAY_FC;
        if (selector === selectRealtimeOverlayPolygonFeatureCollection) return polygonFC;
        return selector({
          data: { mapLayerFilter: { showReportsOnMap: true }, locallyEditedEvent: null },
          view: {
            mapLocationSelection: {
              isPickingLocation: true,
              mode: 'eventGeometry',
              event: { id: 'drawing' },
            },
          },
        });
      });

      render(
        <MapContext.Provider value={mockMap}>
          <EventsRealtimeOverlayLayer onEventClick={jest.fn()} />
        </MapContext.Provider>
      );

      const pushed = polygonSetData.mock.calls.at(-1)[0];
      expect(pushed.features.map((feature) => feature.properties.id)).toEqual(['other']);
    });

    test('binds a hover cursor on the overlay fill layer', () => {
      renderOverlay(mockMap, true);

      const fillCursorBindings = mockMap.on.mock.calls.filter(
        ([type, layerId]) => (type === 'mouseenter' || type === 'mouseleave')
          && layerId === LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY
      );
      expect(fillCursorBindings.map(([type]) => type).sort()).toEqual(['mouseenter', 'mouseleave']);
    });

    test('mouseenter on the fill sets a pointer cursor', () => {
      const setCursor = jest.fn();
      mockMap.getCanvas.mockReturnValue({ style: { set cursor(value) { setCursor(value); } } });
      renderOverlay(mockMap, true);

      const enter = mockMap.on.mock.calls.find(
        ([type, layerId]) => type === 'mouseenter' && layerId === LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY
      )[2];
      enter({ point: { x: 1, y: 1 } });

      expect(setCursor).toHaveBeenCalledWith('pointer');
    });

    test('mouseleave on the fill clears the cursor only when no overlay event layer is still under the pointer', () => {
      const setCursor = jest.fn();
      mockMap.getCanvas.mockReturnValue({ style: { set cursor(value) { setCursor(value); } } });
      renderOverlay(mockMap, true);

      const leave = mockMap.on.mock.calls.find(
        ([type, layerId]) => type === 'mouseleave' && layerId === LAYER_IDS.EVENTS_REALTIME_OVERLAY_GEOMETRY
      )[2];

      // Still over an overlay layer (e.g. an overlapping icon) → do NOT clear the cursor.
      mockMap.queryRenderedFeatures.mockReturnValue([{ properties: { id: 'evt-1' } }]);
      leave({ point: { x: 1, y: 1 } });
      expect(setCursor).not.toHaveBeenCalled();

      // No overlay layer under the pointer → clear the cursor.
      mockMap.queryRenderedFeatures.mockReturnValue([]);
      leave({ point: { x: 2, y: 2 } });
      expect(setCursor).toHaveBeenCalledWith('');
    });
  });

  describe('click handling', () => {
    const renderWithClick = (onEventClick) => {
      useSelector.mockImplementation((selector) => (
        selector === selectRealtimeOverlayFeatureCollection
          ? OVERLAY_FC
          : selector({ data: { mapLayerFilter: { showReportsOnMap: true }, locallyEditedEvent: null } })
      ));

      return render(
        <MapContext.Provider value={mockMap}>
          <EventsRealtimeOverlayLayer onEventClick={onEventClick} />
        </MapContext.Provider>
      );
    };

    test('opens the clicked overlay event with the rendered feature', () => {
      const onEventClick = jest.fn();
      const feature = { properties: { id: 'evt-1' } };
      mockMap.queryRenderedFeatures.mockReturnValue([feature]);

      renderWithClick(onEventClick);
      const event = { point: { x: 1, y: 1 } };
      labeledSymbolLayerProps.onClick(event);

      expect(onEventClick).toHaveBeenCalledWith({ event, layer: feature });
    });

    test('fires once when the icon and label bindings both receive the same click', () => {
      const onEventClick = jest.fn();
      mockMap.queryRenderedFeatures.mockReturnValue([{ properties: { id: 'evt-1' } }]);

      renderWithClick(onEventClick);
      const event = { point: { x: 1, y: 1 } };
      // Simulate the single physical click reaching both layer bindings.
      labeledSymbolLayerProps.onClick(event);
      labeledSymbolLayerProps.onClick(event);

      expect(onEventClick).toHaveBeenCalledTimes(1);
    });

    test('does not open anything when the click hits no feature', () => {
      const onEventClick = jest.fn();
      mockMap.queryRenderedFeatures.mockReturnValue([]);

      renderWithClick(onEventClick);
      labeledSymbolLayerProps.onClick({ point: { x: 1, y: 1 } });

      expect(onEventClick).not.toHaveBeenCalled();
    });
  });
});
