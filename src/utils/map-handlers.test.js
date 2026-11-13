import { withMultiLayerHandlerAwareness, queryMultiLayerClickFeatures } from './map-handlers';

import { createMapMock, createMockMapInteractionEvent } from '../__test-helpers/mocks';
import { LAYER_IDS } from '../constants';


describe('#withMultiLayerHandlerAwareness | higher-order function for multi-feature-layer selection', () => {
  let spy, map, fakeFn, wrapped, mockEventObject;

  const execute = () => wrapped(mockEventObject);

  beforeEach(() => {
    jest.useFakeTimers();

    map = createMapMock();

    map.queryRenderedFeatures.mockReturnValue([]);

    spy = jest.fn();

    fakeFn = (event) => {
      spy(event);
    };

    wrapped = withMultiLayerHandlerAwareness(map, fakeFn);
    mockEventObject = createMockMapInteractionEvent();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });


  test('if the clicked point has one or fewer layers of interest, execute as normal', () => {
    execute();
    expect(spy).toHaveBeenCalledTimes(1);

    map.queryRenderedFeatures.mockReturnValue([{ properties: { id: 1 } }]);

    execute();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('if the clicked point has more than one layer of interest, do not execute the function', () => {
    map.queryRenderedFeatures.mockReturnValue([{ properties: { id: 1 } }, { properties: { id: 2 } }]);

    execute();
    expect(spy).not.toHaveBeenCalled();

  });
});

describe('#queryMultiLayerClickFeatures', () => {
  test('fetching unique layers by ID', () => {
    const map = createMapMock();
    const event = createMockMapInteractionEvent({ point: { x: 1, y: 2 } });

    map.queryRenderedFeatures.mockReturnValue([
      { properties: { id: 'whatever' } },
      { properties: { id: 'neat' } },
      { properties: { id: 'hello' } },
      { properties: { id: 'whatever' } },
      { properties: { id: 'yes' } },
    ]);


    const result = queryMultiLayerClickFeatures(map, event);
    expect(result).toEqual([
      { properties: { id: 'whatever' } },
      { properties: { id: 'neat' } },
      { properties: { id: 'hello' } },
      { properties: { id: 'yes' } },
    ]);
  });

  test('rekeys polygon tile features to event_id and dedupes a polygon\'s fill + centroid into one', () => {
    const map = createMapMock();
    const event = createMockMapInteractionEvent({ point: { x: 1, y: 2 } });

    // A polygon event's centroid and fill share the EventGeometry `id` but carry the real `event_id`.
    map.queryRenderedFeatures.mockReturnValue([
      { layer: { id: LAYER_IDS.EVENTS_VECTOR_CENTROID_SYMBOLS }, geometry: { type: 'Point', coordinates: [0, 0] }, properties: { id: 'geom-1', event_id: 'evt-1', event_type_value: 'fire' } },
      { layer: { id: LAYER_IDS.EVENTS_VECTOR_GEOMETRY }, geometry: { type: 'Polygon' }, properties: { id: 'geom-1', event_id: 'evt-1', event_type_value: 'fire' } },
      { layer: { id: LAYER_IDS.EVENT_SYMBOLS }, properties: { id: 'point-evt' } },
    ]);

    const result = queryMultiLayerClickFeatures(map, event);
    const ids = result.map((feature) => feature.properties.id);

    // The two geom-1 features collapse to a single row keyed by event_id; the point event is untouched.
    expect(ids).toEqual(['evt-1', 'point-evt']);
    expect(result[0].properties.event_type).toBe('fire');
  });

  test('does NOT rewrite id from event_id for a feature outside the polygon tile layers (flag-OFF safety)', () => {
    const map = createMapMock();
    const event = createMockMapInteractionEvent({ point: { x: 1, y: 2 } });

    // A non-vector-tile feature that happens to carry an `event_id` must keep its own `id` — the
    // rewrite is scoped to the polygon tile layers so the flag-OFF picker is never affected.
    map.queryRenderedFeatures.mockReturnValue([
      { layer: { id: LAYER_IDS.EVENT_SYMBOLS }, properties: { id: 'real-id', event_id: 'other-id' } },
    ]);

    const result = queryMultiLayerClickFeatures(map, event);

    expect(result.map((feature) => feature.properties.id)).toEqual(['real-id']);
  });
});