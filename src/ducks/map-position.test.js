import mapPositionReducer, { setMapPosition } from './map-position';

describe('mapPositionReducer', () => {
  it('should return the initial state', () => {
    expect(mapPositionReducer(undefined, {})).toEqual({
      bearing: 0,
      center: null,
      pitch: 0,
      zoom: null,
    });
  });

  it('should handle SET_MAP_POSITION', () => {
    const payload = {
      bearing: 2,
      center: { lng: -122.5190, lat: 37.7045 },
      pitch: 66,
      zoom: 12,
    };
    expect(mapPositionReducer(undefined, setMapPosition(payload))).toEqual(payload);
  });
});