import tokens from '@allenai/design-system/earthranger/tokens.json';

const BLACK_CHANNELS = [0, 0, 0];
const WHITE_CHANNELS = [255, 255, 255];

const toTokenName = (specName) => specName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Mapbox paint and drawn images cannot read CSS custom properties, so JS takes
// the light values of the same tokens tokens.css declares, keyed by their
// names without the --er- prefix.
export const COLOR_TOKENS = Object.fromEntries(
  Object.entries(tokens.color).map(([specName, token]) => [toTokenName(specName), (token.light ?? token).$value.hex])
);

const toChannels = (hexColor) => [1, 3, 5].map((index) => parseInt(hexColor.slice(index, index + 2), 16));

const toHex = (channels) => `#${channels.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;

const mix = (hexColor, otherChannels, amount) => toHex(
  toChannels(hexColor).map((channel, index) => channel + (otherChannels[index] - channel) * amount)
);

export const shade = (hexColor, amount) => mix(hexColor, BLACK_CHANNELS, amount);

export const tint = (hexColor, amount) => mix(hexColor, WHITE_CHANNELS, amount);

export const withOpacity = (hexColor, opacity) => `rgba(${toChannels(hexColor).join(', ')}, ${opacity})`;

const REACT_SELECT_COLORS = {
  danger: COLOR_TOKENS['ui-status-error-destructive'],
  dangerLight: COLOR_TOKENS['ui-status-bg-error-bg'],
  neutral0: COLOR_TOKENS['ui-background-elevated-component'],
  neutral5: COLOR_TOKENS['ui-background-tertiary-background'],
  neutral10: COLOR_TOKENS['ui-background-tertiary-background'],
  neutral20: COLOR_TOKENS['ui-field-outline'],
  neutral30: shade(COLOR_TOKENS['ui-field-outline'], 0.15),
  neutral40: COLOR_TOKENS['ui-text-disabled'],
  neutral50: COLOR_TOKENS['ui-text-disabled'],
  neutral60: COLOR_TOKENS['ui-icons'],
  neutral70: COLOR_TOKENS['ui-text-secondary-text'],
  neutral80: COLOR_TOKENS['ui-text-primary-text'],
  neutral90: COLOR_TOKENS['ui-text-primary-text'],
  primary: COLOR_TOKENS['ui-cta-primary'],
  primary25: COLOR_TOKENS['ui-background-selected-background'],
  primary50: tint(COLOR_TOKENS['ui-cta-primary'], 0.8),
  primary75: tint(COLOR_TOKENS['ui-cta-primary'], 0.25),
};

// react-select draws with a blue palette of its own unless given a theme.
export const themeReactSelect = (theme) => ({ ...theme, colors: { ...theme.colors, ...REACT_SELECT_COLORS } });
