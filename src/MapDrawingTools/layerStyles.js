import { DEFAULT_SYMBOL_PAINT } from '../constants';

export const linePaint = {
  'line-color': 'orange',
  'line-dasharray': [2, 4],
  'line-width': 2,
};

export const lineLayout = {
  'line-join': 'round',
  'line-cap': 'round',
};

export const symbolLayout = {
  'text-allow-overlap': true,
  'icon-allow-overlap': true,
  'symbol-placement': 'line-center',
  'text-font': ['Open Sans Regular'],
  'text-field': ['get', 'lengthLabel'],
};

export const symbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
  'text-halo-width': 2,
};

export const circlePaint = {
  'circle-radius': 5,
  'circle-color': 'orange',
};

export const fillLayout = { visibility: 'visible' };
export const fillPaint = { 'fill-color': 'red', 'fill-opacity': 0.4 };