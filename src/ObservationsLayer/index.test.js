import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import ObservationsLayer, { OBSERVATIONS_LINES_LAYER_ID } from './';
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

jest.mock('../constants', () => ({
  API_URL: 'http://test-api.com/',
  LAYER_IDS: {
    OBSERVATIONS_LINES: 'observations-lines',
  }
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

describe('ObservationsLayer', () => {
  let map;
  let mockUseSelector;

  const defaultState = {
    data: {
      token: { access_token: 'test-token' },
      mapLayerFilter: { hiddenFeatureIDs: [] }
    },
    view: {
      mapFeatureHighlightIDs: []
    }
  };

  beforeEach(() => {
    map = createMapMock();
    mockUseSelector = useSelector;
    mockUseSelector.mockImplementation((selector) => selector(defaultState));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(
      <MapContext.Provider value={map}>
        <ObservationsLayer />
      </MapContext.Provider>
    );
  });

  test('adds observations source and layer to map', () => {
    map.getSource.mockReturnValue(null);
    map.getLayer.mockReturnValue(null);

    render(
      <MapContext.Provider value={map}>
        <ObservationsLayer />
      </MapContext.Provider>
    );

    expect(map.addSource).toHaveBeenCalledWith('observations-source', expect.objectContaining({
      type: 'vector',
      tiles: ['http://test-api.com/observations/tiles/{z}/{x}/{y}.pbf'],
      minzoom: 0,
      maxzoom: 22
    }));

    expect(map.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: OBSERVATIONS_LINES_LAYER_ID,
      type: 'line',
      source: 'observations-source',
      'source-layer': 'observations'
    }));
  });

  test('handles feature click events', () => {
    const onFeatureClick = jest.fn();
    const mockFeature = { properties: { id: 'test-observation' } };

    map.queryRenderedFeatures.mockReturnValue([mockFeature]);

    render(
      <MapContext.Provider value={map}>
        <ObservationsLayer onFeatureClick={onFeatureClick} />
      </MapContext.Provider>
    );

    const clickHandler = map.on.mock.calls.find(call =>
      call[0] === 'click' && call[1] === OBSERVATIONS_LINES_LAYER_ID
    )[2];

    const mockEvent = createMockInteractionEvent();
    clickHandler(mockEvent);

    expect(map.queryRenderedFeatures).toHaveBeenCalledWith(mockEvent.point, {
      layers: [OBSERVATIONS_LINES_LAYER_ID]
    });
    expect(onFeatureClick).toHaveBeenCalledWith(mockFeature, mockEvent);
  });

  test('filters out hidden features', () => {
    const stateWithHiddenFeatures = {
      ...defaultState,
      data: {
        ...defaultState.data,
        mapLayerFilter: { hiddenFeatureIDs: ['hidden-obs-1', 'hidden-obs-2'] }
      }
    };

    mockUseSelector.mockImplementation((selector) => selector(stateWithHiddenFeatures));

    render(
      <MapContext.Provider value={map}>
        <ObservationsLayer />
      </MapContext.Provider>
    );

    expect(map.addLayer).toHaveBeenCalledWith(expect.objectContaining({
      filter: ['all', ['==', ['geometry-type'], 'LineString'], ['!', ['in', ['get', 'id'], ['literal', ['hidden-obs-1', 'hidden-obs-2']]]]]
    }));
  });

  test('highlights features based on mapFeatureHighlightIDs', () => {
    const stateWithHighlights = {
      ...defaultState,
      view: {
        mapFeatureHighlightIDs: ['highlight-obs-1']
      }
    };

    mockUseSelector.mockImplementation((selector) => selector(stateWithHighlights));

    const mockLayer = { id: OBSERVATIONS_LINES_LAYER_ID };
    map.getLayer.mockReturnValue(mockLayer);

    render(
      <MapContext.Provider value={map}>
        <ObservationsLayer />
      </MapContext.Provider>
    );

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      OBSERVATIONS_LINES_LAYER_ID,
      'line-color',
      expect.arrayContaining([
        'case',
        ['in', ['get', 'id'], ['literal', ['highlight-obs-1']]],
        'red'
      ])
    );
  });

  test('cleans up layers and event handlers on unmount', () => {
    const { unmount } = render(
      <MapContext.Provider value={map}>
        <ObservationsLayer />
      </MapContext.Provider>
    );

    unmount();

    expect(map.off).toHaveBeenCalledWith('click', OBSERVATIONS_LINES_LAYER_ID, expect.any(Function));
    expect(map.off).toHaveBeenCalledWith('mouseenter', OBSERVATIONS_LINES_LAYER_ID, expect.any(Function));
    expect(map.off).toHaveBeenCalledWith('mouseleave', OBSERVATIONS_LINES_LAYER_ID, expect.any(Function));
    expect(map.removeLayer).toHaveBeenCalledWith(OBSERVATIONS_LINES_LAYER_ID);
    expect(map.removeSource).toHaveBeenCalledWith('observations-source');
  });
});