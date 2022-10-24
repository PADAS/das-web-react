import { withMultiLayerHandlerAwareness } from './map-handlers';


describe('#withMultiLayerHandlerAwareness | higher-order function for multi-feature-layer selection', () => {
  let spy, fakeFn, wrapped, mockEventObject;

  const execute = () => wrapped(mockEventObject);
  const executeAndRunPendingTimers = () => {

    execute();

    jest.runOnlyPendingTimers();
  };

  beforeEach(() => {
    jest.useFakeTimers();

    spy = jest.fn();

    fakeFn = (event) => {
      spy(event);
    };

    wrapped = withMultiLayerHandlerAwareness(fakeFn);
    mockEventObject = {};

  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });


  test('debouncing the handler function', () => {
    execute();
    expect(spy).not.toHaveBeenCalled();

    jest.runOnlyPendingTimers();
    expect(spy).toHaveBeenCalled();
  });

  test('if the event object does not have a .singleLayerSelected property, execute as normal', () => {
    executeAndRunPendingTimers();
    expect(spy).toHaveBeenCalled();
  });

  test('if the event object has a .singleLayerSelected property, execute only if singleLayerSelected == true', () => {
    mockEventObject.singleLayerSelected = false;

    executeAndRunPendingTimers();
    expect(spy).not.toHaveBeenCalled();

    mockEventObject.singleLayerSelected = true;

    executeAndRunPendingTimers();
    expect(spy).toHaveBeenCalled();

  });
});