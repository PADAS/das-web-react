import { COLOR_TOKENS, shade, tint, withOpacity } from './colors';

describe('utils - colors', () => {
  describe('COLOR_TOKENS', () => {
    test('keys the semantic tokens by their CSS custom property names', () => {
      expect(COLOR_TOKENS['ui-cta-primary']).toBe('#0f865d');
      expect(COLOR_TOKENS['ui-status-error-destructive']).toBe('#d0031b');
      expect(COLOR_TOKENS['ui-patrol-status-track-line-mobile']).toBe('#e76826');
    });

    test('takes the light value of tokens that have a dark one', () => {
      expect(COLOR_TOKENS['ui-text-primary-text']).toBe('#0a3235');
    });

    test('includes the primitives, which have a single value', () => {
      expect(COLOR_TOKENS['greyscale-0']).toBe('#000000');
      expect(COLOR_TOKENS['teal-3-05']).toBe('#f2f9f9');
    });
  });

  describe('shade', () => {
    test('mixes a color with black by the given amount', () => {
      expect(shade('#ffffff', 0.5)).toBe('#808080');
      expect(shade('#0f865d', 0)).toBe('#0f865d');
      expect(shade('#0f865d', 1)).toBe('#000000');
    });
  });

  describe('tint', () => {
    test('mixes a color with white by the given amount', () => {
      expect(tint('#000000', 0.5)).toBe('#808080');
      expect(tint('#3e35a3', 0.95)).toBe('#f5f5fa');
    });
  });

  describe('withOpacity', () => {
    test('returns the color as rgba with the given opacity', () => {
      expect(withOpacity('#ffffff', 0.7)).toBe('rgba(255, 255, 255, 0.7)');
    });
  });
});
