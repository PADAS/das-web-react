import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import SpatialFeaturesLayer, { SYMBOLS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID } from './';
import { MapContext } from '../App';
import { createMapMock, createMockInteractionEvent } from '../__test-helpers/mocks';

// Mock the App module to provide MapContext
jest.mock('../App', () => {
  const React = require('react');
  const MapContext = React.createContext(null);
  return { MapContext };
});

// Mock these to prevent dependency chain issues
jest.mock('../utils/analyzers', () => ({}));
jest.mock('../ducks/analyzers', () => ({}));
jest.mock('../utils/map', () => ({
  addMapImage: jest.fn()
}));
jest.mock('../MessageBadgeLayer', () => ({
  LAYER_ID: 'message-badge-layer'
}));

jest.mock('../constants', () => ({
  API_URL: 'http://test-api.com/',
  DEFAULT_SYMBOL_LAYOUT: {
    'icon-image': ['get', 'image'],
    'icon-size': 1.2
  },
  DEFAULT_SYMBOL_PAINT: {
    'text-color': '#000000'
  },
  LAYER_IDS: {
    ANALYZER_LINES_CRITICAL: 'analyzer-line-critical',
    ANALYZER_LINES_WARNING: 'analyzer-line-warning',
    ANALYZER_POLYS_CRITICAL: 'analyzer-polygon-critical',
    ANALYZER_POLYS_WARNING: 'analyzer-polygon-warning',
    EVENT_GEOMETRY_LAYER: 'event-geometry-layer',
    CLUSTERS_LAYER_ID: 'clusters-layer'
  },
  SOURCE_IDS: {
    ANALYZER_LINES_CRITICAL_SOURCE: 'analyzer-line-critical-source',
    ANALYZER_LINES_WARNING_SOURCE: 'analyzer-line-warning-source',
    ANALYZER_POLYS_CRITICAL_SOURCE: 'analyzer-polygon-critical-source',
    ANALYZER_POLYS_WARNING_SOURCE: 'analyzer-polygon-warning-source',
    CLUSTERS_SOURCE_ID: 'clusters-source'
  },
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

describe('SpatialFeaturesLayer', () => {
  let mockMap;
  let mockOnFeatureClick;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMap = createMapMock();
    mockOnFeatureClick = jest.fn();

    // Mock the selectors
    useSelector.mockImplementation(selector => {
      if (selector.toString().includes('token')) {
        return { access_token: 'mock-token' };
      }
      if (selector.toString().includes('mapFeatureHighlightIDs')) {
        return ['highlight-feature-1', 'highlight-feature-2'];
      }
      if (selector.toString().includes('hiddenFeatureIDs')) {
        return ['hidden-feature-1', 'hidden-feature-2'];
      }
      return null;
    });
  });

  test('should add source and all three main layers when they do not exist', () => {
    // Configure mock to return null for getSource and getLayer to simulate they don't exist
    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);

    render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    // Verify source was added
    expect(mockMap.addSource).toHaveBeenCalledWith('spatial-features-source', expect.objectContaining({
      type: 'vector',
      tiles: [expect.stringContaining('spatialfeatures/tiles/{z}/{x}/{y}.pbf')],
    }));

    // Verify all three main layers were added
    expect(mockMap.addLayer).toHaveBeenCalledTimes(3);

    // Verify symbol layer was added
    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: SYMBOLS_LAYER_ID,
      type: 'symbol',
      source: 'spatial-features-source',
      'source-layer': 'spatial_features',
      filter: expect.arrayContaining([
        'all',
        ['==', ['geometry-type'], 'Point'],
        ['!', ['in', ['get', 'id'], ['literal', ['hidden-feature-1', 'hidden-feature-2']]]]
      ])
    }), 'message-badge-layer');

    // Verify line layer was added
    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: LINES_LAYER_ID,
      type: 'line',
      source: 'spatial-features-source',
      'source-layer': 'spatial_features',
      filter: expect.arrayContaining([
        'all',
        ['==', ['geometry-type'], 'LineString'],
        ['!', ['in', ['get', 'id'], ['literal', ['hidden-feature-1', 'hidden-feature-2']]]]
      ])
    }), 'message-badge-layer');

    // Verify polygon layer was added
    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: POLYGONS_LAYER_ID,
      type: 'fill',
      source: 'spatial-features-source',
      'source-layer': 'spatial_features',
      filter: expect.arrayContaining([
        'all',
        ['==', ['geometry-type'], 'Polygon'],
        ['!', ['in', ['get', 'id'], ['literal', ['hidden-feature-1', 'hidden-feature-2']]]]
      ])
    }), 'message-badge-layer');

    // Verify click handlers were added
    expect(mockMap.on).toHaveBeenCalledWith('click', SYMBOLS_LAYER_ID, expect.any(Function));
    expect(mockMap.on).toHaveBeenCalledWith('click', LINES_LAYER_ID, expect.any(Function));
    expect(mockMap.on).toHaveBeenCalledWith('click', POLYGONS_LAYER_ID, expect.any(Function));
  });

  test('should not add layers that already exist', () => {
    // Mock that the source and all layers already exist
    mockMap.getSource.mockReturnValue({});
    mockMap.getLayer.mockReturnValue({});

    render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    // Source should not be added again
    expect(mockMap.addSource).not.toHaveBeenCalled();

    // No layers should be added
    expect(mockMap.addLayer).not.toHaveBeenCalled();
  });

  test('should handle feature clicks correctly', () => {
    // Setup mock feature for testing click handler
    const mockFeature = {
      type: 'Feature',
      properties: { id: 'feature1' },
      geometry: { type: 'Point', coordinates: [10, 20] }
    };

    mockMap.queryRenderedFeatures.mockReturnValue([mockFeature]);

    render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    // Find and extract the click handler
    const clickHandler = mockMap.on.mock.calls.find(call =>
      call[0] === 'click' && call[1] === SYMBOLS_LAYER_ID
    )[2];

    // Create a mock event
    const mockEvent = createMockInteractionEvent({ point: { x: 100, y: 100 } });

    // Invoke the click handler
    clickHandler(mockEvent);

    // Verify feature lookup and callback
    expect(mockMap.queryRenderedFeatures).toHaveBeenCalledWith(
      mockEvent.point,
      { layers: [SYMBOLS_LAYER_ID, LINES_LAYER_ID, POLYGONS_LAYER_ID] }
    );
    expect(mockOnFeatureClick).toHaveBeenCalledWith(mockFeature, mockEvent);
  });

  test('should apply highlight colors to lines and polygons', () => {
    // Mock that layers exist
    mockMap.getLayer.mockImplementation(id => {
      if ([LINES_LAYER_ID, POLYGONS_LAYER_ID].includes(id)) {
        return { id };
      }
      return null;
    });

    render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    // Verify line highlights
    expect(mockMap.setPaintProperty).toHaveBeenCalledWith(
      LINES_LAYER_ID,
      'line-color',
      expect.arrayContaining([
        'case',
        ['in', ['get', 'id'], ['literal', ['highlight-feature-1', 'highlight-feature-2']]], 'red'
      ])
    );

    // Verify polygon highlights
    expect(mockMap.setPaintProperty).toHaveBeenCalledWith(
      POLYGONS_LAYER_ID,
      'fill-color',
      expect.arrayContaining([
        'case',
        ['in', ['get', 'id'], ['literal', ['highlight-feature-1', 'highlight-feature-2']]], 'red'
      ])
    );
  });
});