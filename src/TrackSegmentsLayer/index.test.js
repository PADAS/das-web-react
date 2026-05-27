import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import TrackSegmentsLayer from './';
import { MapContext } from '../App';
import { createMapMock } from '../__test-helpers/mocks';

jest.mock('../App', () => {
  const React = require('react');
  return { MapContext: React.createContext(null) };
});

jest.mock('../utils/map', () => ({
  addMapImage: jest.fn(),
  safeRemoveMapLayer: jest.fn(),
}));

jest.mock('../constants', () => ({
  API_URL: 'http://test-api.com/',
  MAP_ICON_SCALE: 2,
}));

jest.mock('../utils/tracks', () => ({
  getVtRangeParam: (days) => {
    const steps = [30, 45, 60, 90, 150, 210, 365, 500];
    const step = steps.find((s) => days <= s);
    return step !== undefined ? String(step) : 'all';
  },
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

// Prevent deep import chain (selectors/tracks → ducks/tracks → store → …)
jest.mock('../selectors/tracks', () => ({
  selectTrackLengthInDays: (state) => state?.view?.trackLengthInDays ?? 21,
  selectTrackTimeEnvelope: (state) => state?.view?.trackTimeEnvelope,
}));


const TRACK_SINCE = new Date('2026-02-02T00:00:00Z');

const buildMockState = (overrides = {}) => ({
  view: {
    trackSettings: {
      isSegmentOnTimeEnabled: false,
      isSegmentOnSpeedEnabled: false,
      segmentTimeGapLength: 3600,
      segmentSpeedLimit: 60,
      ...overrides.trackSettings,
    },
    showTrackTimepoints: overrides.showTrackTimepoints ?? true,
    subjectTrackState: { pinned: [], visible: [], ...overrides.subjectTrackState },
    trackTimeEnvelope: { from: TRACK_SINCE, until: null, ...overrides.trackTimeEnvelope },
    trackLengthInDays: overrides.trackLengthInDays,
  },
});

describe('TrackSegmentsLayer', () => {
  let mockMap;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMap = createMapMock();
    mockMap.hasImage.mockReturnValue(true); // skip arrow image setup
    mockMap.getFilter = jest.fn().mockReturnValue(null);

    const state = buildMockState();
    useSelector.mockImplementation((selector) => selector(state));
  });

  // ── layer setup ──────────────────────────────────────────────────

  describe('source and layer setup', () => {
    test('adds vector tile source and both layers when they do not exist', () => {
      mockMap.getSource.mockReturnValue(null);
      mockMap.getLayer.mockReturnValue(null);

      render(
        <MapContext.Provider value={mockMap}>
          <TrackSegmentsLayer />
        </MapContext.Provider>
      );

      expect(mockMap.addSource).toHaveBeenCalledWith('track-segments-source', expect.objectContaining({
        type: 'vector',
        tiles: ['http://test-api.com/observations/segments/tiles/{z}/{x}/{y}.pbf?range=30'],
        minzoom: 0,
        maxzoom: 22,
      }));

      // Line layer
      expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
        id: 'track-segments-layer',
        type: 'line',
        source: 'track-segments-source',
        'source-layer': 'observation_segments',
      }));

      // Arrow/symbol layer
      expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
        id: 'track-segments-start-layer',
        type: 'symbol',
        source: 'track-segments-source',
        'source-layer': 'observation_segments',
      }));
    });

    test('does not duplicate source or layers when they already exist', () => {
      mockMap.getSource.mockReturnValue({ type: 'vector' });
      mockMap.getLayer.mockReturnValue({ id: 'existing' });

      render(
        <MapContext.Provider value={mockMap}>
          <TrackSegmentsLayer />
        </MapContext.Provider>
      );

      expect(mockMap.addSource).not.toHaveBeenCalled();
      expect(mockMap.addLayer).not.toHaveBeenCalled();
    });

    test.each([
      [1,   '30'],
      [30,  '30'],
      [31,  '45'],
      [45,  '45'],
      [46,  '60'],
      [60,  '60'],
      [61,  '90'],
      [90,  '90'],
      [91,  '150'],
      [150, '150'],
      [151, '210'],
      [210, '210'],
      [211, '365'],
      [365, '365'],
      [366, '500'],
      [500, '500'],
      [501, 'all'],
      [999, 'all'],
    ])('uses range=%s in tile URL when track length is %i days', (trackLengthInDays, expectedRange) => {
      mockMap.getSource.mockReturnValue(null);
      mockMap.getLayer.mockReturnValue(null);
      const state = buildMockState({ trackLengthInDays });
      useSelector.mockImplementation((selector) => selector(state));

      render(
        <MapContext.Provider value={mockMap}>
          <TrackSegmentsLayer />
        </MapContext.Provider>
      );

      expect(mockMap.addSource).toHaveBeenCalledWith('track-segments-source', expect.objectContaining({
        tiles: [`http://test-api.com/observations/segments/tiles/{z}/{x}/{y}.pbf?range=${expectedRange}`],
      }));
    });
  });

  // ── filter behaviour ─────────────────────────────────────────────

  describe('client-side filters via setFilter', () => {
    beforeEach(() => {
      // Layers "already exist" so the filter effect can find them
      mockMap.getSource.mockReturnValue({ type: 'vector' });
      mockMap.getLayer.mockReturnValue({ id: 'exists' });
      mockMap.getFilter.mockReturnValue(null);
    });

    test('filters by visible subject IDs and track time envelope', () => {
      const state = buildMockState({
        subjectTrackState: { pinned: ['aaa'], visible: ['bbb'] },
      });
      useSelector.mockImplementation((selector) => selector(state));

      render(
        <MapContext.Provider value={mockMap}>
          <TrackSegmentsLayer />
        </MapContext.Provider>
      );

      const expectedFilter = [
        'all',
        ['in', ['get', 'subject_id'], ['literal', ['aaa', 'bbb']]],
        ['>=', ['get', 'start_time'], TRACK_SINCE.toISOString()],
      ];

      expect(mockMap.setFilter).toHaveBeenCalledWith('track-segments-layer', expectedFilter);
      expect(mockMap.setFilter).toHaveBeenCalledWith('track-segments-start-layer', expectedFilter);
    });

    test('includes upper bound when trackTimeEnvelope.until is set', () => {
      const until = new Date('2026-02-09T00:00:00Z');
      const state = buildMockState({
        subjectTrackState: { pinned: ['aaa'], visible: [] },
        trackTimeEnvelope: { from: TRACK_SINCE, until },
      });
      useSelector.mockImplementation((selector) => selector(state));

      render(
        <MapContext.Provider value={mockMap}>
          <TrackSegmentsLayer />
        </MapContext.Provider>
      );

      const filter = mockMap.setFilter.mock.calls[0][1];
      expect(filter).toContainEqual(
        ['<=', ['get', 'start_time'], until.toISOString()]
      );
    });

    test('adds time gap filter when segmentation on time is enabled', () => {
      const state = buildMockState({
        subjectTrackState: { pinned: ['aaa'], visible: [] },
        trackSettings: { isSegmentOnTimeEnabled: true, segmentTimeGapLength: 3600 },
      });
      useSelector.mockImplementation((selector) => selector(state));

      render(
        <MapContext.Provider value={mockMap}>
          <TrackSegmentsLayer />
        </MapContext.Provider>
      );

      const filter = mockMap.setFilter.mock.calls[0][1];
      // segmentTimeGapLength (seconds) * 1000 → ms
      expect(filter).toContainEqual(['<=', ['get', 'time_gap_ms'], 3600000]);
    });

    test('adds speed filter when segmentation on speed is enabled', () => {
      const state = buildMockState({
        subjectTrackState: { pinned: ['aaa'], visible: [] },
        trackSettings: { isSegmentOnSpeedEnabled: true, segmentSpeedLimit: 60 },
      });
      useSelector.mockImplementation((selector) => selector(state));

      render(
        <MapContext.Provider value={mockMap}>
          <TrackSegmentsLayer />
        </MapContext.Provider>
      );

      const filter = mockMap.setFilter.mock.calls[0][1];
      expect(filter).toContainEqual(['<=', ['get', 'speed_kmh'], 60]);
    });

    test('combines all filters when all segmentation settings are enabled', () => {
      const until = new Date('2026-02-09T00:00:00Z');
      const state = buildMockState({
        subjectTrackState: { pinned: ['x'], visible: ['y'] },
        trackTimeEnvelope: { from: TRACK_SINCE, until },
        trackSettings: {
          isSegmentOnTimeEnabled: true,
          segmentTimeGapLength: 7200,
          isSegmentOnSpeedEnabled: true,
          segmentSpeedLimit: 100,
        },
      });
      useSelector.mockImplementation((selector) => selector(state));

      render(
        <MapContext.Provider value={mockMap}>
          <TrackSegmentsLayer />
        </MapContext.Provider>
      );

      const filter = mockMap.setFilter.mock.calls[0][1];

      expect(filter[0]).toBe('all');
      expect(filter).toContainEqual(['in', ['get', 'subject_id'], ['literal', ['x', 'y']]]);
      expect(filter).toContainEqual(['>=', ['get', 'start_time'], TRACK_SINCE.toISOString()]);
      expect(filter).toContainEqual(['<=', ['get', 'start_time'], until.toISOString()]);
      expect(filter).toContainEqual(['<=', ['get', 'time_gap_ms'], 7200000]);
      expect(filter).toContainEqual(['<=', ['get', 'speed_kmh'], 100]);
    });
  });

  // ── paint config ─────────────────────────────────────────────────

  describe('paint configuration', () => {
    test('uses server-driven line-width (stroke-width or stroke_width) with zoom step', () => {
      mockMap.getSource.mockReturnValue(null);
      mockMap.getLayer.mockReturnValue(null);

      render(
        <MapContext.Provider value={mockMap}>
          <TrackSegmentsLayer />
        </MapContext.Provider>
      );

      const lineLayerCall = mockMap.addLayer.mock.calls.find(
        ([config]) => config.id === 'track-segments-layer'
      );
      const lineWidth = lineLayerCall[0].paint['line-width'];
      expect(lineWidth[0]).toBe('step');
      expect(lineWidth[1]).toEqual(['zoom']);
      expect(lineWidth[2]).toBe(3);
      expect(lineWidth[3]).toBe(8);
      expect(lineWidth[4]).toEqual(['*', expect.any(Array), 1.75]);
      const widthCase = lineWidth[4][1];
      expect(widthCase).toEqual(['case', ['has', 'stroke-width'], ['get', 'stroke-width'], ['has', 'stroke_width'], ['get', 'stroke_width'], 1]);
    });

    test('uses stroke color with stable random fallback by subject_id', () => {
      mockMap.getSource.mockReturnValue(null);
      mockMap.getLayer.mockReturnValue(null);

      render(
        <MapContext.Provider value={mockMap}>
          <TrackSegmentsLayer />
        </MapContext.Provider>
      );

      const lineLayerCall = mockMap.addLayer.mock.calls.find(
        ([config]) => config.id === 'track-segments-layer'
      );
      const lineColor = lineLayerCall[0].paint['line-color'];
      expect(lineColor[0]).toBe('case');
      const emptyStr = '';
      expect(lineColor[1]).toEqual(['all', ['has', 'stroke'], ['!=', ['get', 'stroke'], emptyStr]]);
      expect(lineColor[2]).toEqual(['to-color', ['get', 'stroke']]);
      expect(lineColor[3][0]).toBe('rgb');
      expect(lineColor[3][1]).toEqual(['random', 64, 224, ['concat', ['get', 'subject_id'], '-r']]);
      const lineOpacity = lineLayerCall[0].paint['line-opacity'];
      expect(lineOpacity[0]).toBe('case');
      expect(lineOpacity).toContainEqual(['has', 'stroke-opacity']);
      expect(lineOpacity).toContainEqual(['has', 'stroke_opacity']);
      expect(lineOpacity).toContainEqual(0.8);
    });
  });

  // ── timepoint visibility toggle ──────────────────────────────────

  describe('timepoint arrow visibility', () => {
    beforeEach(() => {
      mockMap.getSource.mockReturnValue({ type: 'vector' });
      mockMap.getLayer.mockReturnValue({ id: 'exists' });
      mockMap.getFilter.mockReturnValue(null);
    });

    test('sets arrow layer visible when showTrackTimepoints is true', () => {
      const state = buildMockState({ showTrackTimepoints: true });
      useSelector.mockImplementation((selector) => selector(state));

      render(
        <MapContext.Provider value={mockMap}>
          <TrackSegmentsLayer />
        </MapContext.Provider>
      );

      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'track-segments-start-layer', 'visibility', 'visible'
      );
    });

    test('hides arrow layer when showTrackTimepoints is false', () => {
      const state = buildMockState({ showTrackTimepoints: false });
      useSelector.mockImplementation((selector) => selector(state));

      render(
        <MapContext.Provider value={mockMap}>
          <TrackSegmentsLayer />
        </MapContext.Provider>
      );

      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(
        'track-segments-start-layer', 'visibility', 'none'
      );
    });
  });

  // ── cleanup ──────────────────────────────────────────────────────

  test('removes layers but not the shared source on unmount', () => {
    const { safeRemoveMapLayer } = require('../utils/map');

    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);

    const { unmount } = render(
      <MapContext.Provider value={mockMap}>
        <TrackSegmentsLayer />
      </MapContext.Provider>
    );

    // Simulate layers existing at unmount time
    mockMap.getLayer.mockReturnValue({ id: 'exists' });

    unmount();

    expect(safeRemoveMapLayer).toHaveBeenCalledWith(mockMap, 'track-segments-layer');
    expect(safeRemoveMapLayer).toHaveBeenCalledWith(mockMap, 'track-segments-start-layer');
    // Source must NOT be removed — it is shared with SubjectTileLayer
    expect(safeRemoveMapLayer).toHaveBeenCalledTimes(2);
  });

  // ── edge cases ───────────────────────────────────────────────────

  test('renders without crashing when map is null', () => {
    const { container } = render(
      <MapContext.Provider value={null}>
        <TrackSegmentsLayer />
      </MapContext.Provider>
    );

    expect(container).toBeInTheDocument();
    expect(mockMap.addSource).not.toHaveBeenCalled();
    expect(mockMap.addLayer).not.toHaveBeenCalled();
  });
});
