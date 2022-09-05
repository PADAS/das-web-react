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

export const lineSymbolLayout = {
  'text-allow-overlap': true,
  'icon-allow-overlap': true,
  'symbol-placement': 'line-center',
  'text-font': ['Open Sans Regular'],
  'text-field': ['get', 'lengthLabel'],
};

export const polygonSymbolLayout = {
  'text-allow-overlap': true,
  'icon-allow-overlap': true,
  'symbol-placement': 'point',
  'text-font': ['Open Sans Regular'],
  'text-field': ['get', 'areaLabel'],
};

export const symbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
  'text-halo-width': 2,
};

export const circlePaint = {
  'circle-radius': [
    'case',
    ['==', ['get', 'midpointCenter'], true],
    5,
    7,
  ],
  'circle-color': [
    'case',
    ['==', ['get', 'midpointCenter'], true],
    'white',
    'orange',
  ],
};

export const fillLayout = { visibility: 'visible' };
export const fillPaint = { 'fill-color': 'red', 'fill-opacity': 0.4 };