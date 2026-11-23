import { COLOR_TOKENS } from '../utils/colors';
import { DEFAULT_SYMBOL_PAINT } from '../constants';

const DRAWING_COLOR = COLOR_TOKENS['amber-3'];
const DRAWING_POINT_HIGHLIGHT_COLOR = COLOR_TOKENS['greyscale-white'];

export const linePaint = {
  'line-color': DRAWING_COLOR,
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
    [
      'any',
      ['==', ['get', 'pointHover'], true],
      ['==', ['get', 'midpointHover'], true],
    ],
    11,
    5,
  ],

  'circle-color': [
    'case',
    [
      'any',
      ['==', ['get', 'midpoint'], true],
      ['==', ['get', 'pointHover'], true],
      ['==', ['get', 'midpointHover'], true],
    ],
    DRAWING_POINT_HIGHLIGHT_COLOR,
    DRAWING_COLOR,
  ],

  'circle-stroke-color': [
    'case',
    [
      'any',
      ['==', ['get', 'initialPoint'], true],
      ['==', ['feature-state', 'selected'], true],
    ],
    DRAWING_POINT_HIGHLIGHT_COLOR,
    DRAWING_COLOR,
  ],

  'circle-opacity': [
    'case',
    [
      'any',
      ['==', ['get', 'pointHover'], true],
      ['==', ['get', 'midpointHover'], true],
    ],
    [
      'case',
      ['==', ['feature-state', 'isHovering'], true],
      0.5,
      0,
    ],
    1,
  ],

  'circle-stroke-width': [
    'case',
    [
      'any',
      ['==', ['get', 'pointHover'], true],
      ['==', ['get', 'midpointHover'], true],
    ],
    0,
    2,
  ],
};

export const fillLayout = { visibility: 'visible' };
export const fillPaint = { 'fill-color': COLOR_TOKENS['red-3'], 'fill-opacity': 0.4 };
export const lightFillPaint = { ...fillPaint, 'fill-opacity': 0.1 };