import isString from 'lodash/isString';

export const createMapMock = (override = {}) => {
  let boundEvents = [];

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
    on: jest.fn((name, ...rest) => {
      const layerId = isString(rest[0]) ? rest[0] : '';
      const callback = !!layerId ? rest[1] : rest[0];

      const eventId = `${name}-${layerId}`;

      boundEvents.push({ callback: callback, id: eventId });
    }),
    once: jest.fn(),
    off: jest.fn((name, ...rest) => {
      const layerId = isString(rest[0]) ? rest[0] : '';
      const callback = !!layerId ? rest[1] : rest[0];

      const eventId = `${name}-${layerId}`;

      boundEvents = boundEvents.filter((boundEvent) => boundEvent.id !== eventId || boundEvent.callback !== callback);
    }),
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
        const layerId = isString(rest[0]) ? rest[0] : '';
        const eventObj = layerId ? rest[1] : rest[0];

        const eventId = `${handlerName}-${layerId}`;

        boundEvents.forEach((boundEvent) => {
          const matchesId = !layerId ? boundEvent.id.startsWith(eventId) : boundEvent.id === eventId;
          if (matchesId) {
            boundEvent.callback(createMockMapInteractionEvent(eventObj));
          }
        });
      },
    }
  };

  return mockMap;
};

export const createMockInteractionEvent = (data) => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  ...data,
});


export const createMockMapInteractionEvent = (data) => ({
  preventDefault: jest.fn(),
  originalEvent: createMockInteractionEvent(),
  ...data,
});