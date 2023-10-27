import mapPositionReducer, { setMapPosition } from './map-position';

describe('mapPositionReducer', () => {
  it('should return the initial state', () => {
    expect(mapPositionReducer(undefined, {})).toEqual({
      bearing: 0,
      bounds: null,
      pitch: 0,
      zoom: null,
    });
  });

  it('should handle SET_MAP_POSITION', () => {
    const payload = {
      bearing: 2,
      bounds: {
        _sw: { lng: -122.5190, lat: 37.7045 },
        _ne: { lng: -122.3556, lat: 37.8324 },
      },
      pitch: 66,
      zoom: 12,
    };
    expect(mapPositionReducer(undefined, setMapPosition(payload))).toEqual(payload);
  });
});