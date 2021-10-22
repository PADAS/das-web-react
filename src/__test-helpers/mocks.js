export const createMapMock = (override = {}) => {
  const mockMap = {
    addSource: jest.fn(),
    getBounds: jest.fn().mockReturnValue({
      _ne: { lat: -2.8749870286402768, lng: 37.55610681436622 },
      _sw: { lat: -3.480332977332381, lng: 36.96196978906826 },
    }),
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