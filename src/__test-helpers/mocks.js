export const createMapMock = (override = {}) => {
  const mockMap = {
    addSource: jest.fn(),
    getContainer: jest.fn().mockReturnValue({ clientHeight: 1000, clientWidth: 1000 }),
    removeSource: jest.fn(),
    addLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    setLayerZoomRange: jest.fn(),
    getLayer: jest.fn(),
    addImage: jest.fn(),
    loadImage: jest.fn(),
    removeImage: jest.fn(),
    hasImage: jest.fn(),
    getSource: jest.fn().mockReturnValue({ setData: jest.fn() }),
    project: jest.fn(),
    setTerrain: jest.fn(),
    ...override,
    __test__: {
      fireHandlers: (handlerName, eventObj) => {
        const toCall = mockMap.on.mock.calls.filter(([name]) => name === handlerName);
        toCall.forEach(([, func]) => func(eventObj));
      },
    }
  };

  return mockMap;
};