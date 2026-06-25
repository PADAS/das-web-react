import React from 'react';
import { featureCollection, point } from '@turf/turf';
import { render } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';

import { ADD_EVENT, PRUNE_EVENTS } from '../ducks/events-realtime-overlay';
import { createMapMock } from '../__test-helpers/mocks';
import { selectRealtimeOverlayFeatureCollection } from '../selectors/events-realtime-overlay';
import { MapContext } from '../MapContext';
import { SOURCE_IDS } from '../constants';

import EventsRealtimeOverlayLayer from './';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

// Capture the props the overlay hands to the shared label component.
let labeledSymbolLayerProps;
jest.mock('../LabeledSymbolLayer', () => (props) => {
  labeledSymbolLayerProps = props;
  return null;
});

jest.mock('../selectors/events-realtime-overlay', () => ({
  selectRealtimeOverlayFeatureCollection: jest.fn(),
}));

// Bypass the multi-layer guard so the inner click handler always fires.
jest.mock('../utils/map-handlers', () => ({
  withMultiLayerHandlerAwareness: (_map, fn) => fn,
}));

const OVERLAY_FC = featureCollection([point([0, 0], { id: 'evt-1' })]);

const renderOverlay = (map, showReportsOnMap = true, locallyEditedEventId) => {
  useSelector.mockImplementation((selector) => (
    selector === selectRealtimeOverlayFeatureCollection
      ? OVERLAY_FC
      : selector({
        data: {
          mapLayerFilter: { showReportsOnMap },
          locallyEditedEvent: locallyEditedEventId ? { id: locallyEditedEventId } : null,
        },
      })
  ));

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

  test('removes the overlay source on unmount', () => {
    mockMap.getSource.mockReturnValue({ setData: jest.fn() });

    const { unmount } = renderOverlay(mockMap, true);
    unmount();

    expect(mockMap.removeSource).toHaveBeenCalledWith(SOURCE_IDS.EVENTS_REALTIME_OVERLAY_SOURCE);
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
