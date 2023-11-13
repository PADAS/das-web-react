import { validateLocation } from './location';

describe('validateLocation', () => {
  test('returns true if location is valid', () => {
    expect(validateLocation({ lat: 0, lng: 0 })).toBe(true);
    expect(validateLocation({ lat: -2.4543, lng: 47.8392 })).toBe(true);
    expect(validateLocation({ lat: 23.0921, lng: -112.3835 })).toBe(true);
    expect(validateLocation({ lat: 90, lng: -180 })).toBe(true);
    expect(validateLocation({ lat: -90, lng: 180 })).toBe(true);
  });

  test('returns false if location is invalid', () => {
    expect(validateLocation()).toBe(false);
    expect(validateLocation({})).toBe(false);
    expect(validateLocation({ lat: 23.0921 })).toBe(false);
    expect(validateLocation({ lng: -112.3835 })).toBe(false);
    expect(validateLocation({ lat: 0, lng: 181 })).toBe(false);
    expect(validateLocation({ lat: 0, lng: -181 })).toBe(false);
    expect(validateLocation({ lat: 91, lng: 0 })).toBe(false);
    expect(validateLocation({ lat: -91, lng: 0 })).toBe(false);
  });
});
