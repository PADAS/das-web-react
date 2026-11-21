import { calcJumpCoordinatesForBbox, parseAtlasMapMessage } from './atlas-map-messages';

const UUID = '6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f';

describe('utils - atlas-map-messages', () => {
  describe('parseAtlasMapMessage', () => {
    test.each([
      ['null', null],
      ['a string', 'jump-to'],
      ['an array', [{ action: 'jump-to' }]],
      ['a missing action', { coordinates: [1, 2] }],
      ['an unknown action', { action: 'delete-everything' }],
      ['a show-overlay action', {
        action: 'show-overlay',
        geojson: { features: [{ geometry: { coordinates: [1, 2], type: 'Point' }, type: 'Feature' }], type: 'FeatureCollection' },
      }],
      ['a clear-overlay action', { action: 'clear-overlay' }],
      ['an inherited action name', { action: 'toString' }],
    ])('returns null for %s', (_, data) => {
      expect(parseAtlasMapMessage(data)).toBeNull();
    });

    describe('jump-to', () => {
      test('returns the coordinates', () => {
        expect(parseAtlasMapMessage({ action: 'jump-to', coordinates: [36.8, -1.3] }))
          .toEqual({ action: 'jump-to', coordinates: [36.8, -1.3] });
      });

      test('returns the zoom when present', () => {
        expect(parseAtlasMapMessage({ action: 'jump-to', coordinates: [36.8, -1.3], zoom: 12 }))
          .toEqual({ action: 'jump-to', coordinates: [36.8, -1.3], zoom: 12 });
      });

      test('accepts the zoom bounds', () => {
        expect(parseAtlasMapMessage({ action: 'jump-to', coordinates: [0, 0], zoom: 0 })).not.toBeNull();
        expect(parseAtlasMapMessage({ action: 'jump-to', coordinates: [0, 0], zoom: 22 })).not.toBeNull();
      });

      test('drops fields outside the contract', () => {
        expect(parseAtlasMapMessage({ action: 'jump-to', coordinates: [1, 2], extra: 'x' }))
          .toEqual({ action: 'jump-to', coordinates: [1, 2] });
      });

      test.each([
        ['missing coordinates', {}],
        ['coordinates that are not an array', { coordinates: '1,2' }],
        ['a single coordinate', { coordinates: [1] }],
        ['three coordinates', { coordinates: [1, 2, 3] }],
        ['a string coordinate', { coordinates: ['1', 2] }],
        ['a NaN coordinate', { coordinates: [NaN, 2] }],
        ['an infinite coordinate', { coordinates: [Infinity, 2] }],
        ['a longitude above 180', { coordinates: [180.1, 0] }],
        ['a longitude below -180', { coordinates: [-180.1, 0] }],
        ['a latitude above 90', { coordinates: [0, 90.1] }],
        ['a latitude below -90', { coordinates: [0, -90.1] }],
        ['a zoom below 0', { coordinates: [0, 0], zoom: -1 }],
        ['a zoom above 22', { coordinates: [0, 0], zoom: 22.1 }],
        ['a string zoom', { coordinates: [0, 0], zoom: '10' }],
        ['a null zoom', { coordinates: [0, 0], zoom: null }],
        ['an infinite zoom', { coordinates: [0, 0], zoom: Infinity }],
      ])('returns null for %s', (_, params) => {
        expect(parseAtlasMapMessage({ action: 'jump-to', ...params })).toBeNull();
      });
    });

    describe('fit-bounds', () => {
      test('returns the bbox', () => {
        expect(parseAtlasMapMessage({ action: 'fit-bounds', bbox: [-10, -5, 10, 5] }))
          .toEqual({ action: 'fit-bounds', bbox: [-10, -5, 10, 5] });
      });

      test('accepts a bbox without area', () => {
        expect(parseAtlasMapMessage({ action: 'fit-bounds', bbox: [1, 2, 1, 2] })).not.toBeNull();
      });

      test.each([
        ['a missing bbox', {}],
        ['a bbox that is not an array', { bbox: '-10,-5,10,5' }],
        ['a bbox with three values', { bbox: [-10, -5, 10] }],
        ['a bbox with five values', { bbox: [-10, -5, 10, 5, 0] }],
        ['a non-numeric value', { bbox: [-10, '-5', 10, 5] }],
        ['a NaN value', { bbox: [-10, NaN, 10, 5] }],
        ['a west out of range', { bbox: [-181, -5, 10, 5] }],
        ['an east out of range', { bbox: [-10, -5, 181, 5] }],
        ['a south out of range', { bbox: [-10, -91, 10, 5] }],
        ['a north out of range', { bbox: [-10, -5, 10, 91] }],
        ['a west greater than east', { bbox: [10, -5, -10, 5] }],
        ['a south greater than north', { bbox: [-10, 5, 10, -5] }],
      ])('returns null for %s', (_, params) => {
        expect(parseAtlasMapMessage({ action: 'fit-bounds', ...params })).toBeNull();
      });
    });

    describe('open-record', () => {
      test.each(['event', 'patrol'])('returns a %s record', (erType) => {
        expect(parseAtlasMapMessage({ action: 'open-record', er_type: erType, id: UUID }))
          .toEqual({ action: 'open-record', er_type: erType, id: UUID });
      });

      test('accepts an uppercase UUID', () => {
        expect(parseAtlasMapMessage({ action: 'open-record', er_type: 'event', id: UUID.toUpperCase() })).not.toBeNull();
      });

      test.each([
        ['an unknown record type', { er_type: 'subject', id: UUID }],
        ['a missing record type', { id: UUID }],
        ['a missing id', { er_type: 'event' }],
        ['a numeric id', { er_type: 'event', id: 123 }],
        ['an id that is not a UUID', { er_type: 'event', id: 'abc' }],
        ['an id with a path', { er_type: 'event', id: `${UUID}/../settings` }],
        ['an id with surrounding text', { er_type: 'event', id: ` ${UUID}` }],
      ])('returns null for %s', (_, params) => {
        expect(parseAtlasMapMessage({ action: 'open-record', ...params })).toBeNull();
      });
    });
  });

  describe('calcJumpCoordinatesForBbox', () => {
    test('returns the corners of a bbox with area', () => {
      expect(calcJumpCoordinatesForBbox([-10, -5, 10, 5])).toEqual([[-10, -5], [10, 5]]);
    });

    test('returns a single point for a bbox without area', () => {
      expect(calcJumpCoordinatesForBbox([1, 2, 1, 2])).toEqual([1, 2]);
    });
  });
});
