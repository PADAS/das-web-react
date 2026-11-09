import tokens from '@allenai/design-system/earthranger/tokens.json';

import { ER_LEGACY_COLORS } from './er-legacy-theme';

const BLACK_CHANNELS = [0, 0, 0];
const CSS_VARIABLE_REGEX = /^var\(--[a-z0-9-]+\)$/;
const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i;
const WHITE_CHANNELS = [255, 255, 255];

// Mirrors the steps of common/styles/_colors.scss.
export const COLOR_STEPS = {
  hoverShade: 15,
  rowTint: 95,
};

const toTokenName = (specName) => specName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// The light values of the tokens tokens.css declares, keyed by their names
// without the --er- prefix, for Mapbox paint and drawn images.
export const COLOR_TOKENS = {
  ...Object.fromEntries(Object.keys(tokens.color).map((specName) => [
    toTokenName(specName),
    (tokens.color[specName].light ?? tokens.color[specName]).$value.hex,
  ])),
  // Mapbox and drawn images need hex, so the er-legacy overrides apply here too.
  ...ER_LEGACY_COLORS,
};

// Token names, so the map draws them as hex and the styles as var().
export const PRIORITY_COLOR_MAP = {
  300: {
    backgroundToken: 'red-6',
    baseToken: 'ui-event-priority-red',
    key: 'red',
  },
  200: {
    backgroundToken: 'amber-6',
    baseToken: 'ui-event-priority-amber',
    key: 'amber',
  },
  100: {
    backgroundToken: 'green-6',
    baseToken: 'ui-event-priority-green',
    key: 'green',
  },
  0: {
    backgroundToken: 'greyscale-11',
    baseToken: 'ui-event-priority-grey',
    key: 'none',
  },
};

export const tokenVar = (tokenName) => `var(--er-${tokenName})`;

const toChannels = (hexColor) => [1, 3, 5].map((index) => parseInt(hexColor.slice(index, index + 2), 16));

const toHex = (channels) => `#${channels.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;

const assertColorAndPercentage = (color, percentage) => {
  if (!HEX_COLOR_REGEX.test(color) && !CSS_VARIABLE_REGEX.test(color)) {
    throw new TypeError(`Expected a #rrggbb color or a var(), got ${color}.`);
  }
  if (!(percentage >= 0 && percentage <= 100)) {
    throw new RangeError(`Expected a percentage from 0 to 100, got ${percentage}.`);
  }
};

// A hex from COLOR_TOKENS gives a hex, for Mapbox and drawn images; a var()
// gives a color-mix(), as the Sass helpers do.
const mixWith = (otherColor, otherChannels) => (color, percentage) => {
  assertColorAndPercentage(color, percentage);

  return HEX_COLOR_REGEX.test(color)
    ? toHex(toChannels(color).map((channel, index) => channel + (otherChannels[index] - channel) * percentage / 100))
    : `color-mix(in srgb, ${color}, ${otherColor} ${percentage}%)`;
};

export const shade = mixWith('black', BLACK_CHANNELS);

export const tint = mixWith('white', WHITE_CHANNELS);

export const withOpacity = (color, percentage) => {
  assertColorAndPercentage(color, percentage);

  return HEX_COLOR_REGEX.test(color)
    ? `rgba(${toChannels(color).join(', ')}, ${percentage / 100})`
    : `color-mix(in srgb, ${color} ${percentage}%, transparent)`;
};

const REACT_SELECT_COLORS = {
  danger: 'var(--er-ui-status-error-destructive)',
  dangerLight: 'var(--er-ui-status-bg-error-bg)',
  neutral0: 'var(--er-ui-background-elevated-component)',
  neutral5: 'var(--er-ui-background-tertiary-background)',
  neutral10: 'var(--er-ui-background-tertiary-background)',
  neutral20: 'var(--er-ui-field-outline)',
  neutral30: shade('var(--er-ui-field-outline)', COLOR_STEPS.hoverShade),
  neutral40: 'var(--er-ui-text-disabled)',
  neutral50: 'var(--er-ui-text-disabled)',
  neutral60: 'var(--er-ui-icons)',
  neutral70: 'var(--er-ui-text-secondary-text)',
  neutral80: 'var(--er-ui-text-primary-text)',
  neutral90: 'var(--er-ui-text-primary-text)',
  primary: 'var(--er-ui-cta-primary)',
  primary25: 'var(--er-ui-background-selected-background)',
  primary50: tint('var(--er-ui-cta-primary)', 80),
  primary75: tint('var(--er-ui-cta-primary)', 25),
};

// react-select draws with a blue palette of its own unless given a theme.
export const themeReactSelect = (theme) => ({ ...theme, colors: { ...theme.colors, ...REACT_SELECT_COLORS } });
