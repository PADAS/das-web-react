import { DEFAULT_SYMBOL_LAYOUT } from '../constants';


export const BACKGROUND_LAYER = {
  layout: {
    ...DEFAULT_SYMBOL_LAYOUT,
    'icon-size': 1.1,
    'icon-allow-overlap': ['step', ['zoom'], false, 5, true],
    'text-allow-overlap': ['step', ['zoom'], false, 5, true],
    'icon-anchor': 'bottom',
    'text-anchor': 'center',
    'text-justify': 'center',
    'icon-text-fit-padding': [39, 4, -24.5, 1],
    'icon-text-fit': 'both',
    'text-offset': [
      'case',
      ['all', ['==', ['get', 'image'], null], ['has', 'default_status_value']],
      ['literal', [0, .2]],
      ['has', 'default_status_value'],
      ['literal', [0, -.4]],
      ['literal', [0, 0]],
    ],
    'text-field': [
      'case',
      ['all', ['==', ['get', 'image'], null], ['==', ['has', 'default_status_value'], false]],
      ['get', 'name'],
      ['all', ['==', ['get', 'image'], null], ['has', 'default_status_value']],
      ['format',
        ['coalesce', ['get', 'default_status_label'], ['get', 'default_status_value']],
        '\n',
      ],
      ['has', 'default_status_value'],
      ['format',
        ['get', 'default_status_value'],
        '\n',
        ['coalesce', ['get', 'default_status_label'], ['get', 'default_status_value']],
        '\n',
      ],
      ['format',
        'icon',
        { 'font-scale': 1.3 },
        '\n',
      ],
    ],
    'icon-image': 'popup-background',
  },
  paint: {
    'text-color': 'rgba(0,0,0,0.1)',
    'text-halo-width': 0,
    'text-translate': [0, -30],
  }
};

export const LABELS_LAYER = {
  layout: {
    ...DEFAULT_SYMBOL_LAYOUT,
    'icon-allow-overlap': ['step', ['zoom'], false, 5, true],
    'text-allow-overlap': ['step', ['zoom'], false, 5, true],
    'text-offset': [
      'case',
      ['==', ['get', 'image'], null],
      ['literal', [0, -2.5]],
      ['literal', [0, -1.8]],
    ],
    'icon-offset': [
      'case',
      ['has', 'default_status_value'],
      ['literal', [0, -20]],
      ['literal', [0, 7]],
    ],
    'icon-anchor': 'top',
    'text-anchor': 'center',
    'text-justify': 'center',
    'text-field': [
      'case',
      ['all', ['==', ['get', 'image'], null], ['==', ['has', 'default_status_value'], false]],
      ['get', 'name'],
      ['==', ['get', 'image'], null],
      ['format',
        ['get', 'default_status_value'],
        '\n',
        ['coalesce', ['get', 'default_status_label'], ''],
      ],
      ['get', 'default_status_value'],
    ]
  },
  paint: {
    'text-color': '#ffffff',
    'icon-color': '#ffffff',
    'text-halo-width': 0,
    'icon-halo-width': 0,
    'icon-translate': [0, -53],
  }
};