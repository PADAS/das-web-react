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

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

// Prevent deep import chain (selectors/tracks → ducks/tracks → store → …)
jest.mock('../selectors/tracks', () => ({
  selectSubjectTrackState: (state) => state?.view?.subjectTrackState,
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
    subjectTrackState: { pinned: [], visible: [], ...overrides.subjectTrackState },
    trackTimeEnvelope: { from: TRACK_SINCE, until: null, ...overrides.trackTimeEnvelope },
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
        tiles: ['http://test-api.com/observations/segments/tiles/{z}/{x}/{y}.pbf'],
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
        ['>=', ['get', 'start_recorded_at'], TRACK_SINCE.toISOString()],
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
        ['<=', ['get', 'start_recorded_at'], until.toISOString()]
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
      expect(filter).toContainEqual(['>=', ['get', 'start_recorded_at'], TRACK_SINCE.toISOString()]);
      expect(filter).toContainEqual(['<=', ['get', 'start_recorded_at'], until.toISOString()]);
      expect(filter).toContainEqual(['<=', ['get', 'time_gap_ms'], 7200000]);
      expect(filter).toContainEqual(['<=', ['get', 'speed_kmh'], 100]);
    });
  });

  // ── paint config ─────────────────────────────────────────────────

  describe('paint configuration', () => {
    test('configures line-width to scale with zoom', () => {
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
      expect(lineLayerCall[0].paint['line-width']).toEqual([
        'interpolate', ['linear'], ['zoom'],
        3, 1,
        10, 2,
        15, 3,
      ]);
    });

    test('uses stroke color with fallback', () => {
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
      expect(lineLayerCall[0].paint['line-color']).toEqual(['coalesce', ['get', 'stroke'], '#3887be']);
      expect(lineLayerCall[0].paint['line-opacity']).toEqual(['coalesce', ['get', 'stroke-opacity'], 0.8]);
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
