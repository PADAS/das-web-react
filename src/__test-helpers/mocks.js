import isFunction from 'lodash/isFunction';

export const createMapMock = (override = {}) => {
  const mockMap = {
    addSource: jest.fn(),
    getBounds: jest.fn().mockReturnValue({
      _ne: { lat: -2.8749870286402768, lng: 37.55610681436622 },
      _sw: { lat: -3.480332977332381, lng: 36.96196978906826 },
    }),
    setFilter: jest.fn(),
    removeSource: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    setLayerZoomRange: jest.fn(),
    getLayer: jest.fn(),
    getZoom: jest.fn(),
    addImage: jest.fn(),
    loadImage: jest.fn(),
    removeImage: jest.fn(),
    easeTo: jest.fn(),
    flyTo: jest.fn(),
    hasImage: jest.fn(),
    getSource: jest.fn().mockReturnValue({ setData: jest.fn() }),
    project: jest.fn(),
    queryRenderedFeatures: jest.fn(),
    setLayoutProperty: jest.fn(),
    setTerrain: jest.fn(),
    fitBounds: jest.fn(),
    setZoom: jest.fn(),
    ...override,
    __test__: {
      fireHandlers: (handlerName, eventObj) => {
        const toCall = mockMap.on.mock.calls.filter(([name]) => name === handlerName);
        toCall.forEach((item) => {
          const [, ...rest] = item;

          /* skip the optional layerName arg if it hasn't been passed */
          const func = isFunction(rest[0]) ? rest[0] : rest[1];

          func(eventObj);
        });
      },
    }
  };

  return mockMap;
};