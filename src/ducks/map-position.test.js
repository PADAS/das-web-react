import mapPositionReducer, { setMapPosition } from './map-position';

describe('mapPositionReducer', () => {
  it('should return the initial state', () => {
    expect(mapPositionReducer(undefined, {})).toEqual({
      bounds: null,
      zoom: null,
    });
  });

  it('should handle SET_MAP_POSITION', () => {
    const payload = {
      bounds: {
        _sw: { lng: -122.5190, lat: 37.7045 },
        _ne: { lng: -122.3556, lat: 37.8324 },
      },
      zoom: 12,
    };
    expect(mapPositionReducer(undefined, setMapPosition(payload))).toEqual(payload);
  });
});