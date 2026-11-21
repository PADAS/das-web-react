import { formatCameraSearch, parseCameraSearch } from './camera-url';

describe('utils - camera-url', () => {
  describe('formatCameraSearch', () => {
    test('writes the centre with 6 decimals and the zoom with 2', () => {
      expect(formatCameraSearch('', { center: [36.81234567, -1.29876543], zoom: 12.3456 }))
        .toBe('?lnglat=36.812346,-1.298765&zoom=12.35');
    });

    test('keeps the other params, and replaces an earlier camera', () => {
      expect(formatCameraSearch('?a=1&lnglat=1,2&zoom=3&b=x%20y', { center: [10, 20], zoom: 5 }))
        .toBe('?a=1&b=x+y&lnglat=10.000000,20.000000&zoom=5.00');
    });

    test('writes no negative zero', () => {
      expect(formatCameraSearch('', { center: [-0.0000001, -0], zoom: 0 }))
        .toBe('?lnglat=0.000000,0.000000&zoom=0.00');
    });

    test('reads back what it writes', () => {
      expect(parseCameraSearch(formatCameraSearch('?x=1', { center: [-122.4194161, 37.7749301], zoom: 9.87 })))
        .toEqual({ center: [-122.419416, 37.77493], zoom: 9.87 });
    });
  });

  describe('parseCameraSearch', () => {
    test('reads the centre and zoom', () => {
      expect(parseCameraSearch('?lnglat=36.8,-1.3&zoom=12.5')).toEqual({ center: [36.8, -1.3], zoom: 12.5 });
    });

    test('reads a percent-encoded comma and spaces', () => {
      expect(parseCameraSearch('?lnglat=36.8%2C%20-1.3&zoom=4')).toEqual({ center: [36.8, -1.3], zoom: 4 });
    });

    test('reads a centre without a zoom, as record links have', () => {
      expect(parseCameraSearch('?lnglat=36.8,-1.3')).toEqual({ center: [36.8, -1.3], zoom: null });
    });

    test.each([
      ['no lnglat', '?zoom=4'],
      ['an empty search', ''],
      ['one coordinate', '?lnglat=36.8'],
      ['three coordinates', '?lnglat=1,2,3'],
      ['a longitude out of range', '?lnglat=181,0&zoom=4'],
      ['a latitude out of range', '?lnglat=0,-91&zoom=4'],
      ['words', '?lnglat=east,north&zoom=4'],
      ['an empty coordinate', '?lnglat=,1&zoom=4'],
    ])('returns null for %s', (_, search) => {
      expect(parseCameraSearch(search)).toBeNull();
    });

    test.each([
      ['a negative zoom', '-1'],
      ['a zoom past the maximum', '25'],
      ['a zoom that is not a number', 'close'],
      ['an empty zoom', ''],
    ])('reads %s as no zoom', (_, zoom) => {
      expect(parseCameraSearch(`?lnglat=1,2&zoom=${zoom}`)).toEqual({ center: [1, 2], zoom: null });
    });
  });
});
