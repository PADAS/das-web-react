import isString from 'lodash/isString';

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
    moveLayer: jest.fn(),
    removeLayer: jest.fn(),
    removeFeatureState: jest.fn(),
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
    setPaintProperty: jest.fn(),
    setTerrain: jest.fn(),
    fitBounds: jest.fn(),
    setZoom: jest.fn(),
    getStyle: jest.fn(),
    setMaxZoom: jest.fn(),
    setMinZoom: jest.fn(),
    ...override,
    __test__: {
      fireHandlers: (handlerName, ...rest) => {
        const layerName = isString(rest[0]) ? rest[0] : null;
        const eventObj = layerName ? rest[1] : rest[0];

        const toCall = mockMap.on.mock.calls
          .filter(([name, ...rest]) => {
            const layerId = isString(rest[0]) ? rest[0] : null;
            const handlerNameMatches = (name === handlerName);

            if (!layerName) return handlerNameMatches;

            return handlerNameMatches
              && layerName === layerId;
          });

        toCall.forEach((item) => {
          const [, ...rest] = item;
          const layerId = isString(rest[0]) ? rest[0] : null;

          /* skip the optional layerName arg if it hasn't been passed */
          const func = !!layerId ? rest[1] : rest[0];

          func(
            createMockMapInteractionEvent(
              eventObj
            )
          );
        });
      },
    }
  };

  return mockMap;
};


const createMockMapInteractionEvent = (data) => ({
  preventDefault: jest.fn(),
  originalEvent: {
    stopPropagation: jest.fn(),
  },
  ...data,
});