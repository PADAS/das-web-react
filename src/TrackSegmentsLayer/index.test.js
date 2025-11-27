import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import TrackSegmentsLayer from './';
import { MapContext } from '../App';
import { createMapMock } from '../__test-helpers/mocks';

// Mock the App module to provide MapContext
jest.mock('../App', () => {
  const React = require('react');
  const MapContext = React.createContext(null);
  return { MapContext };
});

// Mock utils to prevent dependency chain issues
jest.mock('../utils/map', () => ({
  safeRemoveMapLayer: jest.fn(),
  safeRemoveMapSource: jest.fn(),
}));

jest.mock('../constants', () => ({
  API_URL: 'http://test-api.com/',
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

describe('TrackSegmentsLayer', () => {
  let mockMap;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMap = createMapMock();

    // Mock the filter state selector
    useSelector.mockReturnValue({
      maxSpeedMs: 50,
      maxTimeGapSeconds: 86400
    });
  });

  test('should add source and layer when they do not exist', () => {
    // Configure mock to return null for getSource and getLayer to simulate they don't exist
    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);

    render(
      <MapContext.Provider value={mockMap}>
        <TrackSegmentsLayer />
      </MapContext.Provider>
    );

    // Verify source was added with correct configuration
    expect(mockMap.addSource).toHaveBeenCalledWith('track-segments-source', expect.objectContaining({
      type: 'vector',
      tiles: ['http://test-api.com/observations/segments/tiles/{z}/{x}/{y}.pbf'],
      minzoom: 0,
      maxzoom: 22,
    }));

    // Verify layer was added with correct configuration and filter
    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: 'track-segments-layer',
      type: 'line',
      source: 'track-segments-source',
      'source-layer': 'observation_segments',
      minzoom: 3,
      filter: ['all', ['<=', ['get', 'speed_kmh'], 180], ['<=', ['get', 'time_gap_ms'], 86400000]],
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
        'visibility': 'visible'
      },
      paint: expect.objectContaining({
        'line-color': expect.arrayContaining(['coalesce', ['get', 'stroke'], '#3887be']),
        'line-width': expect.any(Array),
        'line-opacity': expect.arrayContaining(['coalesce', ['get', 'stroke-opacity'], 0.8])
      })
    }));
  });

  test('should not add source or layer if they already exist', () => {
    // Mock that the source and layer already exist
    mockMap.getSource.mockReturnValue({ type: 'vector' });
    mockMap.getLayer.mockReturnValue({ id: 'track-segments-layer' });

    render(
      <MapContext.Provider value={mockMap}>
        <TrackSegmentsLayer />
      </MapContext.Provider>
    );

    // Source should not be added again
    expect(mockMap.addSource).not.toHaveBeenCalled();

    // Layer should not be added
    expect(mockMap.addLayer).not.toHaveBeenCalled();
  });

  test('should apply client-side filters based on speed and time gap', () => {
    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);

    render(
      <MapContext.Provider value={mockMap}>
        <TrackSegmentsLayer />
      </MapContext.Provider>
    );

    // Verify layer filter is configured correctly
    const addLayerCall = mockMap.addLayer.mock.calls[0];
    const layerConfig = addLayerCall[0];

    // Filter should convert m/s to km/h (50 * 3.6 = 180) and seconds to ms (86400 * 1000 = 86400000)
    expect(layerConfig.filter).toEqual([
      'all',
      ['<=', ['get', 'speed_kmh'], 180],
      ['<=', ['get', 'time_gap_ms'], 86400000]
    ]);
  });

  test('should convert filter values correctly in filter expression', () => {
    // Test with different filter values
    useSelector.mockReturnValue({
      maxSpeedMs: 25,
      maxTimeGapSeconds: 3600
    });

    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);

    render(
      <MapContext.Provider value={mockMap}>
        <TrackSegmentsLayer />
      </MapContext.Provider>
    );

    const addLayerCall = mockMap.addLayer.mock.calls[0];
    const layerConfig = addLayerCall[0];

    // Verify filter converts m/s to km/h (25 * 3.6 = 90) and seconds to ms (3600 * 1000 = 3600000)
    expect(layerConfig.filter).toEqual([
      'all',
      ['<=', ['get', 'speed_kmh'], 90],
      ['<=', ['get', 'time_gap_ms'], 3600000]
    ]);
  });

  test('should configure line-width to scale with zoom level', () => {
    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);

    render(
      <MapContext.Provider value={mockMap}>
        <TrackSegmentsLayer />
      </MapContext.Provider>
    );

    const addLayerCall = mockMap.addLayer.mock.calls[0];
    const layerConfig = addLayerCall[0];

    // Verify line-width interpolation config
    expect(layerConfig.paint['line-width']).toEqual([
      'interpolate',
      ['linear'],
      ['zoom'],
      3, 1,   // at zoom 3, width is 1
      10, 2,  // at zoom 10, width is 2
      15, 3   // at zoom 15, width is 3
    ]);
  });

  test('should use subject stroke color with fallback', () => {
    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);

    render(
      <MapContext.Provider value={mockMap}>
        <TrackSegmentsLayer />
      </MapContext.Provider>
    );

    const addLayerCall = mockMap.addLayer.mock.calls[0];
    const layerConfig = addLayerCall[0];

    // Verify line-color uses stroke property with fallback
    expect(layerConfig.paint['line-color']).toEqual([
      'coalesce',
      ['get', 'stroke'],
      '#3887be'
    ]);

    // Verify line-opacity uses stroke-opacity property with fallback
    expect(layerConfig.paint['line-opacity']).toEqual([
      'coalesce',
      ['get', 'stroke-opacity'],
      0.8
    ]);
  });

  test('should render without crashing when map is null', () => {
    const { container } = render(
      <MapContext.Provider value={null}>
        <TrackSegmentsLayer />
      </MapContext.Provider>
    );

    expect(container).toBeInTheDocument();
    expect(mockMap.addSource).not.toHaveBeenCalled();
    expect(mockMap.addLayer).not.toHaveBeenCalled();
  });

  test('should clean up on unmount', () => {
    const { safeRemoveMapLayer, safeRemoveMapSource } = require('../utils/map');

    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);

    const { unmount } = render(
      <MapContext.Provider value={mockMap}>
        <TrackSegmentsLayer />
      </MapContext.Provider>
    );

    // Mock that layers exist for cleanup
    mockMap.getLayer.mockReturnValue({ id: 'track-segments-layer' });
    mockMap.getSource.mockReturnValue({ type: 'vector' });

    unmount();

    // Verify cleanup was called
    expect(safeRemoveMapLayer).toHaveBeenCalledWith(mockMap, 'track-segments-layer');
    expect(safeRemoveMapSource).toHaveBeenCalledWith(mockMap, 'track-segments-source');
  });
});
