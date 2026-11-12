import { readdirSync, readFileSync } from 'fs';
import kebabCase from 'lodash/kebabCase';
import mapValues from 'lodash/mapValues';
import { compileString } from 'sass';

import { COLOR_STEPS, COLOR_TOKENS, shade, themeReactSelect, tint, tokenVar, withOpacity } from './colors';

const SASS_COLOR_VARIABLES = Object.fromEntries(
  [...compileString(
    `@use 'sass:meta';
    @use 'colors';
    a { @each $name, $value in meta.module-variables('colors') { --#{$name}: #{meta.inspect($value)}; } }`,
    { loadPaths: ['src/common/styles'] },
  ).css.matchAll(/--([\w-]+): (.+);/g)].map((match) => [match[1], match[2]])
);

const SOURCE_FILES = readdirSync('src', { recursive: true }).filter((file) => /\.(js|scss)$/.test(file));

const LIGHT_THEME_TOKEN_NAMES = [...readFileSync('node_modules/@allenai/design-system/er-legacy/tokens.css', 'utf8')
  .split('}')[0]
  .matchAll(/--er-([a-z0-9-]+):\s*#/g)].map((match) => match[1]);

const TOKEN_REFERENCE_REGEX = /--er-([a-z0-9-]+)|COLOR_TOKENS\['([^']+)'\]|tokenVar\('([^']+)'\)/g;

describe('utils - colors', () => {
  describe('COLOR_TOKENS', () => {
    test('keys the light values of tokens.css by their names without the --er- prefix', () => {
      expect(COLOR_TOKENS['ui-cta-primary']).toBe('#0056c7');
      expect(COLOR_TOKENS['ui-text-primary-text']).toBe('#000000');
      expect(COLOR_TOKENS['greyscale-11']).toBe('#f9f9f9');
    });

    test('names every color token as tokens.css does', () => {
      expect(Object.keys(COLOR_TOKENS).sort()).toEqual([...LIGHT_THEME_TOKEN_NAMES].sort());
    });

    test('has every token the source names', () => {
      const tokenNames = SOURCE_FILES
        .flatMap((file) => [...readFileSync(`src/${file}`, 'utf8').matchAll(TOKEN_REFERENCE_REGEX)])
        .map((match) => match[1] ?? match[2] ?? match[3]);

      expect(tokenNames.length).toBeGreaterThan(0);
      expect(tokenNames.filter((tokenName) => !COLOR_TOKENS[tokenName])).toEqual([]);
    });
  });

  describe('COLOR_STEPS', () => {
    test('matches the steps of common/styles/_colors.scss', () => {
      expect(mapValues(COLOR_STEPS, (_, step) => SASS_COLOR_VARIABLES[kebabCase(step)]))
        .toEqual(mapValues(COLOR_STEPS, (percentage) => `${percentage}%`));
    });
  });

  describe('tokenVar', () => {
    test('returns the custom property of a token', () => {
      expect(tokenVar('ui-cta-primary')).toBe('var(--er-ui-cta-primary)');
    });
  });

  describe('shade', () => {
    test('mixes a hex color with black by the given percentage', () => {
      expect(shade('#ffffff', 50)).toBe('#808080');
      expect(shade('#0f865d', 0)).toBe('#0f865d');
      expect(shade('#0f865d', 100)).toBe('#000000');
    });

    test('mixes a custom property with black at runtime', () => {
      expect(shade('var(--er-ui-cta-primary)', 15)).toBe('color-mix(in srgb, var(--er-ui-cta-primary), black 15%)');
    });

    test('throws for a color it cannot mix', () => {
      expect(() => shade('#fff', 15)).toThrow(TypeError);
      expect(() => shade(undefined, 15)).toThrow(TypeError);
    });

    test('throws for a percentage out of range', () => {
      expect(() => shade('#ffffff', 0.15 - 1)).toThrow(RangeError);
      expect(() => shade('#ffffff', 150)).toThrow(RangeError);
    });
  });

  describe('tint', () => {
    test('mixes a hex color with white by the given percentage', () => {
      expect(tint('#000000', 50)).toBe('#808080');
      expect(tint('#3e35a3', 95)).toBe('#f5f5fa');
    });

    test('mixes a custom property with white at runtime', () => {
      expect(tint('var(--er-yellow-2)', 95)).toBe('color-mix(in srgb, var(--er-yellow-2), white 95%)');
    });
  });

  describe('withOpacity', () => {
    test('returns a hex color as rgba with the given opacity', () => {
      expect(withOpacity('#ffffff', 70)).toBe('rgba(255, 255, 255, 0.7)');
    });

    test('makes a custom property translucent at runtime', () => {
      expect(withOpacity('var(--er-greyscale-white)', 50))
        .toBe('color-mix(in srgb, var(--er-greyscale-white) 50%, transparent)');
    });

    test('throws for an opacity out of range', () => {
      expect(() => withOpacity('#ffffff', -1)).toThrow(RangeError);
    });
  });

  describe('themeReactSelect', () => {
    test('replaces the react-select palette with the tokens and keeps the rest of the theme', () => {
      const theme = themeReactSelect({ borderRadius: 4, colors: { primary: '#2684ff', primary25: '#deebff' } });

      expect(theme.borderRadius).toBe(4);
      expect(theme.colors.primary).toBe('var(--er-ui-cta-primary)');
      expect(theme.colors.primary25).toBe('var(--er-ui-background-hover-background)');
    });
  });
});
