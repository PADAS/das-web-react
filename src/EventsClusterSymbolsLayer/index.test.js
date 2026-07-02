import React from 'react';
import { render } from '@testing-library/react';

import { createMapMock } from '../__test-helpers/mocks';
import { LAYER_IDS, SOURCE_IDS } from '../constants';
import { MapContext } from '../MapContext';

import EventsClusterSymbolsLayer from './';

let labeledSymbolLayerProps;
jest.mock('../LabeledSymbolLayer', () => (props) => {
  labeledSymbolLayerProps = props;
  return null;
});

jest.mock('../utils/map-handlers', () => ({
  withMultiLayerHandlerAwareness: (_map, fn) => fn,
}));

const renderLayer = (map, onEventClick = jest.fn()) => render(
  <MapContext.Provider value={map}>
    <EventsClusterSymbolsLayer onEventClick={onEventClick} />
  </MapContext.Provider>
);

describe('EventsClusterSymbolsLayer', () => {
  let mockMap;

  beforeEach(() => {
    labeledSymbolLayerProps = undefined;
    mockMap = createMapMock();
    mockMap.getLayer.mockReturnValue({ id: 'exists' });
  });

  it('renders the singleton symbol layer on the shared cluster source', () => {
    renderLayer(mockMap);

    expect(labeledSymbolLayerProps.id).toBe(LAYER_IDS.EVENTS_VECTOR_CLUSTER_SYMBOLS);
    expect(labeledSymbolLayerProps.sourceId).toBe(SOURCE_IDS.CLUSTERS_SOURCE_ID);
    expect(labeledSymbolLayerProps.before).toBe(LAYER_IDS.SUBJECT_SYMBOLS);
  });

  it('renders without a map (no before anchor, click handler is a no-op)', () => {
    renderLayer(null);

    expect(labeledSymbolLayerProps.before).toBeUndefined();
    expect(() => labeledSymbolLayerProps.onClick({ point: { x: 1, y: 1 } })).not.toThrow();
  });

  it('only matches lone (un-clustered) event points', () => {
    renderLayer(mockMap);

    expect(labeledSymbolLayerProps.filter).toEqual([
      'all',
      ['has', 'event_type'],
      ['==', ['has', 'point_count'], false],
      ['==', ['geometry-type'], 'Point'],
    ]);
  });

  describe('click handling', () => {
    it('opens the clicked event with the rendered feature', () => {
      const onEventClick = jest.fn();
      const feature = { properties: { id: 'evt-1', event_type: 'fire' } };
      mockMap.queryRenderedFeatures.mockReturnValue([feature]);

      renderLayer(mockMap, onEventClick);
      const event = { point: { x: 1, y: 1 } };
      labeledSymbolLayerProps.onClick(event);

      expect(onEventClick).toHaveBeenCalledWith({ event, layer: feature });
    });

    it('fires once across the icon + label bindings', () => {
      const onEventClick = jest.fn();
      mockMap.queryRenderedFeatures.mockReturnValue([{ properties: { id: 'evt-1' } }]);

      renderLayer(mockMap, onEventClick);
      const event = { point: { x: 1, y: 1 } };
      labeledSymbolLayerProps.onClick(event);
      labeledSymbolLayerProps.onClick(event);

      expect(onEventClick).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the click hits no feature', () => {
      const onEventClick = jest.fn();
      mockMap.queryRenderedFeatures.mockReturnValue([]);

      renderLayer(mockMap, onEventClick);
      labeledSymbolLayerProps.onClick({ point: { x: 1, y: 1 } });

      expect(onEventClick).not.toHaveBeenCalled();
    });
  });
});
