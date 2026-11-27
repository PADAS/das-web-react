import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { buildGeoSpanFilter } from '../utils/map';
import { COLOR_TOKENS } from '../utils/colors';
import SpatialFeaturesLayer, {
  LINES_HIT_LAYER_ID,
  LINES_LABELS_LAYER_ID,
  LINES_LAYER_ID,
  POLYGONS_LABELS_LAYER_ID,
  POLYGONS_LAYER_ID,
  POLYGONS_OUTLINE_HIT_LAYER_ID,
  POLYGONS_OUTLINE_LAYER_ID,
  SYMBOLS_LABELS_LAYER_ID,
  SYMBOLS_LAYER_ID,
} from './';
import { MapContext } from '../MapContext';
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
  addMapImage: jest.fn(),
  buildGeoSpanFilter: jest.fn().mockReturnValue(null),
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
    CLUSTERS_LAYER_ID: 'clusters-layer',
    SPATIAL_FEATURE_LABELS: 'spatial-features-labels',
  },
  SOURCE_IDS: {
    ANALYZER_LINES_CRITICAL_SOURCE: 'analyzer-line-critical-source',
    ANALYZER_LINES_WARNING_SOURCE: 'analyzer-line-warning-source',
    ANALYZER_POLYS_CRITICAL_SOURCE: 'analyzer-polygon-critical-source',
    ANALYZER_POLYS_WARNING_SOURCE: 'analyzer-polygon-warning-source',
    CLUSTERS_SOURCE_ID: 'clusters-source'
  },
  SYMBOL_TEXT_SIZE_EXPRESSION: 14,
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

describe('SpatialFeaturesLayer', () => {
  let isShowingFeatureNames;
  let mockMap;
  let mockOnFeatureClick;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMap = createMapMock();
    mockOnFeatureClick = jest.fn();
    isShowingFeatureNames = false;

    // Mock the selectors
    useSelector.mockImplementation(selector => {
      if (selector.toString().includes('showMapNames')) {
        return isShowingFeatureNames;
      }
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

  test('should add source, the four main layers, their hit layers and their label layers when they do not exist', () => {
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

    expect(mockMap.addLayer).toHaveBeenCalledTimes(9);

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
    }), 'feature-separation-layer');

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
    }), SYMBOLS_LAYER_ID);

    // Verify polygon outline layer was added
    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: POLYGONS_OUTLINE_LAYER_ID,
      type: 'line',
      source: 'spatial-features-source',
      'source-layer': 'spatial_features',
      filter: expect.arrayContaining([
        'all',
        ['==', ['geometry-type'], 'Polygon'],
        ['!', ['in', ['get', 'id'], ['literal', ['hidden-feature-1', 'hidden-feature-2']]]]
      ])
    }), LINES_LAYER_ID);

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
    }), POLYGONS_OUTLINE_LAYER_ID);

    // Verify click handlers were added
    expect(mockMap.on).toHaveBeenCalledWith('click', SYMBOLS_LAYER_ID, expect.any(Function));
  });

  test('takes clicks on the point symbols and the hit layers of lines and borders, never on polygon fills', () => {
    render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    const clickedLayerIds = mockMap.on.mock.calls.filter((call) => call[0] === 'click').map((call) => call[1]);

    expect(clickedLayerIds).toEqual([SYMBOLS_LAYER_ID, [LINES_HIT_LAYER_ID, POLYGONS_OUTLINE_HIT_LAYER_ID]]);
  });

  test('adds transparent wide hit layers that share the line and polygon filters', () => {
    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);

    render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: LINES_HIT_LAYER_ID,
      type: 'line',
      paint: { 'line-opacity': 0, 'line-width': 10 },
      filter: [
        'all',
        ['==', ['geometry-type'], 'LineString'],
        ['!', ['in', ['get', 'id'], ['literal', ['hidden-feature-1', 'hidden-feature-2']]]],
      ],
    }), SYMBOLS_LAYER_ID);
    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: POLYGONS_OUTLINE_HIT_LAYER_ID,
      type: 'line',
      paint: { 'line-opacity': 0, 'line-width': 10 },
      filter: [
        'all',
        ['==', ['geometry-type'], 'Polygon'],
        ['!', ['in', ['get', 'id'], ['literal', ['hidden-feature-1', 'hidden-feature-2']]]],
      ],
    }), SYMBOLS_LAYER_ID);
  });

  test('adds a hidden name label layer per geometry type when feature names are off', () => {
    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);

    render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: SYMBOLS_LABELS_LAYER_ID,
      type: 'symbol',
      layout: expect.objectContaining({ 'text-field': ['get', 'name'], visibility: 'none' }),
      paint: expect.objectContaining({
        'text-color': COLOR_TOKENS['ui-text-primary-text'],
        'text-halo-color': COLOR_TOKENS['ui-background-primary-background'],
      }),
      filter: [
        'all',
        ['==', ['geometry-type'], 'Point'],
        ['!', ['in', ['get', 'id'], ['literal', ['hidden-feature-1', 'hidden-feature-2']]]],
      ],
    }), 'feature-separation-layer');
    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: LINES_LABELS_LAYER_ID,
      type: 'symbol',
      layout: expect.objectContaining({
        'symbol-placement': 'line',
        'text-field': ['get', 'name'],
        visibility: 'none',
      }),
      filter: [
        'all',
        ['==', ['geometry-type'], 'LineString'],
        ['!', ['in', ['get', 'id'], ['literal', ['hidden-feature-1', 'hidden-feature-2']]]],
      ],
    }), 'feature-separation-layer');
    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: POLYGONS_LABELS_LAYER_ID,
      type: 'symbol',
      layout: expect.objectContaining({ 'text-field': ['get', 'name'], visibility: 'none' }),
      filter: [
        'all',
        ['==', ['geometry-type'], 'Polygon'],
        ['!', ['in', ['get', 'id'], ['literal', ['hidden-feature-1', 'hidden-feature-2']]]],
      ],
    }), 'feature-separation-layer');
  });

  test('adds the name label layers visible when feature names are on', () => {
    isShowingFeatureNames = true;
    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);

    render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    [SYMBOLS_LABELS_LAYER_ID, LINES_LABELS_LAYER_ID, POLYGONS_LABELS_LAYER_ID].forEach((layerId) => {
      expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({
        id: layerId,
        layout: expect.objectContaining({ visibility: 'visible' }),
      }), 'feature-separation-layer');
    });
  });

  test('shows the name label layers when feature names are turned on', () => {
    mockMap.getLayer.mockImplementation((id) => ({ id }));

    const { rerender } = render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    expect(mockMap.setLayoutProperty).not.toHaveBeenCalledWith(SYMBOLS_LABELS_LAYER_ID, 'visibility', 'visible');

    isShowingFeatureNames = true;
    rerender(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={jest.fn()} />
      </MapContext.Provider>
    );

    [SYMBOLS_LABELS_LAYER_ID, LINES_LABELS_LAYER_ID, POLYGONS_LABELS_LAYER_ID].forEach((layerId) => {
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(layerId, 'visibility', 'visible');
    });
  });

  test('hides the name label layers when feature names are turned off', () => {
    isShowingFeatureNames = true;
    mockMap.getLayer.mockImplementation((id) => ({ id }));

    const { rerender } = render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    expect(mockMap.setLayoutProperty).not.toHaveBeenCalledWith(SYMBOLS_LABELS_LAYER_ID, 'visibility', 'none');

    isShowingFeatureNames = false;
    rerender(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={jest.fn()} />
      </MapContext.Provider>
    );

    [SYMBOLS_LABELS_LAYER_ID, LINES_LABELS_LAYER_ID, POLYGONS_LABELS_LAYER_ID].forEach((layerId) => {
      expect(mockMap.setLayoutProperty).toHaveBeenCalledWith(layerId, 'visibility', 'none');
    });
  });

  test('removes its layers and source when it unmounts', () => {
    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);

    const { unmount } = render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    mockMap.getLayer.mockImplementation((id) => ({ id }));
    unmount();

    [
      SYMBOLS_LAYER_ID,
      LINES_LAYER_ID,
      POLYGONS_OUTLINE_LAYER_ID,
      POLYGONS_LAYER_ID,
      LINES_HIT_LAYER_ID,
      POLYGONS_OUTLINE_HIT_LAYER_ID,
      SYMBOLS_LABELS_LAYER_ID,
      LINES_LABELS_LAYER_ID,
      POLYGONS_LABELS_LAYER_ID,
    ].forEach((layerId) => {
      expect(mockMap.removeLayer).toHaveBeenCalledWith(layerId);
    });
    expect(mockMap.removeSource).toHaveBeenCalledWith('spatial-features-source');
  });

  test('stops taking clicks on lines and borders when it unmounts', () => {
    mockMap.queryRenderedFeatures.mockReturnValue([{ layer: { id: LINES_HIT_LAYER_ID } }]);

    const { unmount } = render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    unmount();

    [LINES_HIT_LAYER_ID, POLYGONS_OUTLINE_HIT_LAYER_ID].forEach((layerId) => {
      mockMap.__test__.fireHandlers('click', layerId, { features: [{ properties: { id: 'line-feature' } }] });
    });

    expect(mockMap.off).toHaveBeenCalledWith(
      'click',
      [LINES_HIT_LAYER_ID, POLYGONS_OUTLINE_HIT_LAYER_ID],
      expect.any(Function)
    );
    expect(mockOnFeatureClick).not.toHaveBeenCalled();
  });

  test.each([SYMBOLS_LAYER_ID, LINES_HIT_LAYER_ID, POLYGONS_OUTLINE_HIT_LAYER_ID])(
    'shows a pointer cursor while hovering the %s layer',
    (layerId) => {
      const canvas = { style: { cursor: '' } };
      mockMap.getCanvas.mockReturnValue(canvas);

      render(
        <MapContext.Provider value={mockMap}>
          <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
        </MapContext.Provider>
      );

      mockMap.__test__.fireHandlers('mouseenter', layerId, {});

      expect(canvas.style.cursor).toBe('pointer');

      mockMap.__test__.fireHandlers('mouseleave', layerId, {});

      expect(canvas.style.cursor).toBe('');
    }
  );

  test('hides the name label layers of the features hidden by id', () => {
    mockMap.getLayer.mockImplementation((id) => ({ id }));

    render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    const hiddenFeatureFilter = ['!', ['in', ['get', 'id'], ['literal', ['hidden-feature-1', 'hidden-feature-2']]]];

    expect(mockMap.setFilter).toHaveBeenCalledWith(
      SYMBOLS_LABELS_LAYER_ID,
      ['all', ['==', ['geometry-type'], 'Point'], hiddenFeatureFilter]
    );
    expect(mockMap.setFilter).toHaveBeenCalledWith(
      LINES_LABELS_LAYER_ID,
      ['all', ['==', ['geometry-type'], 'LineString'], hiddenFeatureFilter]
    );
    expect(mockMap.setFilter).toHaveBeenCalledWith(
      POLYGONS_LABELS_LAYER_ID,
      ['all', ['==', ['geometry-type'], 'Polygon'], hiddenFeatureFilter]
    );
    expect(mockMap.setFilter).toHaveBeenCalledWith(
      LINES_HIT_LAYER_ID,
      ['all', ['==', ['geometry-type'], 'LineString'], hiddenFeatureFilter]
    );
    expect(mockMap.setFilter).toHaveBeenCalledWith(
      POLYGONS_OUTLINE_HIT_LAYER_ID,
      ['all', ['==', ['geometry-type'], 'Polygon'], hiddenFeatureFilter]
    );
  });

  describe('clicking a line or a polygon border', () => {
    const lineFeature = {
      type: 'Feature',
      properties: { id: 'line-feature' },
      geometry: { type: 'LineString', coordinates: [[10, 20], [11, 21]] },
    };

    const clickLine = () => {
      const lineClickHandler = mockMap.on.mock.calls.find((call) => call[0] === 'click' && Array.isArray(call[1]))[2];
      const event = createMockInteractionEvent({
        features: [lineFeature],
        lngLat: { lat: 20.5, lng: 10.5 },
        point: { x: 100, y: 100 },
      });

      lineClickHandler(event);

      return event;
    };

    const renderAndClickLineUnder = (renderedFeatures) => {
      mockMap.queryRenderedFeatures.mockImplementation((point, options) => (options ? [] : renderedFeatures));
      render(
        <MapContext.Provider value={mockMap}>
          <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
        </MapContext.Provider>
      );

      return clickLine();
    };

    test('reports the line when its hit layer is topmost at the click', () => {
      const event = renderAndClickLineUnder([{ layer: { id: LINES_HIT_LAYER_ID } }, { layer: { id: LINES_LAYER_ID } }]);

      expect(mockOnFeatureClick).toHaveBeenCalledTimes(1);
      expect(mockOnFeatureClick).toHaveBeenCalledWith(lineFeature, event);
    });

    test('reports the polygon when its border hit layer is topmost at the click', () => {
      renderAndClickLineUnder([{ layer: { id: POLYGONS_OUTLINE_HIT_LAYER_ID } }, { layer: { id: POLYGONS_LAYER_ID } }]);

      expect(mockOnFeatureClick).toHaveBeenCalledTimes(1);
    });

    test('lets the click through a feature name drawn above the line', () => {
      renderAndClickLineUnder([
        { layer: { id: LINES_LABELS_LAYER_ID } },
        { layer: { id: SYMBOLS_LABELS_LAYER_ID } },
        { layer: { id: LINES_HIT_LAYER_ID } },
      ]);

      expect(mockOnFeatureClick).toHaveBeenCalledTimes(1);
    });

    test('leaves the click to a feature point above the line', () => {
      renderAndClickLineUnder([{ layer: { id: SYMBOLS_LAYER_ID } }, { layer: { id: LINES_HIT_LAYER_ID } }]);

      expect(mockOnFeatureClick).not.toHaveBeenCalled();
    });

    test.each([
      ['an event geometry', 'event-geometry-layer'],
      ['a track timepoint', 'track-layer-points-subject-1'],
      ['a static sensor', 'unclustered_static_sensors_layer'],
    ])('leaves the click to %s drawn above the line', (_, layerId) => {
      renderAndClickLineUnder([{ layer: { id: layerId } }, { layer: { id: LINES_HIT_LAYER_ID } }]);

      expect(mockOnFeatureClick).not.toHaveBeenCalled();
    });
  });

  test('keeps its source and layers when the access token or the click handler changes', () => {
    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);

    const { rerender } = render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    useSelector.mockImplementation((selector) => {
      const selectorSource = selector.toString();
      if (selectorSource.includes('token')) return { access_token: 'refreshed-token' };
      if (selectorSource.includes('mapFeatureHighlightIDs')) return ['highlight-feature-1', 'highlight-feature-2'];
      if (selectorSource.includes('hiddenFeatureIDs')) return ['hidden-feature-1', 'hidden-feature-2'];
      return null;
    });
    rerender(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={jest.fn()} />
      </MapContext.Provider>
    );

    expect(mockMap.removeSource).not.toHaveBeenCalled();
    expect(mockMap.addSource).toHaveBeenCalledTimes(1);
  });

  test('should include bounds in addSource call when geoSpan is configured', () => {
    const mockBbox = [-10, -5, 10, 5];
    buildGeoSpanFilter.mockReturnValueOnce(mockBbox);

    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);

    useSelector.mockImplementation(selector => {
      const str = selector.toString();
      if (str.includes('token')) return { access_token: 'mock-token' };
      if (str.includes('systemConfig')) return { lon: [-10, 10], lat: [-5, 5] };
      if (str.includes('mapFeatureHighlightIDs')) return [];
      if (str.includes('hiddenFeatureIDs')) return [];
      return null;
    });

    render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    expect(buildGeoSpanFilter).toHaveBeenCalledWith({ lon: [-10, 10], lat: [-5, 5] });
    expect(mockMap.addSource).toHaveBeenCalledWith('spatial-features-source', expect.objectContaining({
      bounds: mockBbox,
    }));
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

  test('reports only the topmost point under a click', () => {
    const mockFeature = {
      type: 'Feature',
      properties: { id: 'feature1' },
      geometry: { type: 'Point', coordinates: [10, 20] }
    };
    const otherMockFeature = {
      type: 'Feature',
      properties: { id: 'feature2' },
      geometry: { type: 'Point', coordinates: [10, 20] }
    };

    mockMap.queryRenderedFeatures.mockReturnValue([mockFeature, otherMockFeature]);

    render(
      <MapContext.Provider value={mockMap}>
        <SpatialFeaturesLayer onFeatureClick={mockOnFeatureClick} />
      </MapContext.Provider>
    );

    // Find and extract the click handler
    const clickHandler = mockMap.on.mock.calls.find(call =>
      call[0] === 'click' && call[1] === SYMBOLS_LAYER_ID
    )[2];

    const mockEvent = createMockInteractionEvent({
      features: [mockFeature, otherMockFeature],
      point: { x: 100, y: 100 },
    });
    clickHandler(mockEvent);

    expect(mockOnFeatureClick).toHaveBeenCalledTimes(1);
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
        ['in', ['get', 'id'], ['literal', ['highlight-feature-1', 'highlight-feature-2']]], COLOR_TOKENS['red-4']
      ])
    );

    // Verify polygon highlights
    expect(mockMap.setPaintProperty).toHaveBeenCalledWith(
      POLYGONS_LAYER_ID,
      'fill-color',
      expect.arrayContaining([
        'case',
        ['in', ['get', 'id'], ['literal', ['highlight-feature-1', 'highlight-feature-2']]], COLOR_TOKENS['red-4']
      ])
    );
  });
});