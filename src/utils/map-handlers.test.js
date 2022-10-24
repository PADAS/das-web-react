import { withMultiLayerHandlerAwareness } from './map-handlers';

import { createMapMock, createMockMapInteractionEvent } from '../__test-helpers/mocks';


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