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
    'icon-text-fit-padding': [37, 3, -26, 0],
    'icon-text-fit': 'both',
    'icon-image': 'popup-background',
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
      // no icon either default prop
      ['all', ['==', ['get', 'image'], null], ['==', ['has', 'default_status_value'], false]],
      ['get', 'name'],
      // no icon but default prop and data is simplified
      ['all', ['==', ['get', 'image'], null], ['has', 'default_status_value'], ['==', ['get', 'data_map_id_simplified'], true]],
      ['get', 'default_status_value'],
      // has icon and default prop but show names is enabled (simplified must be off)
      ['all', ['has', 'default_status_value'], ['==', ['get', 'data_map_id_simplified'], false], ['==', ['get', 'show_map_names'], true]],
      ['format',
        ['get', 'default_status_value'],
        '\n',
        ['get', 'default_status_label'],
        '\n',
        ['get', 'name'],
      ],
      // same as previous but without showing map names
      ['all', ['has', 'default_status_value'], ['==', ['get', 'data_map_id_simplified'], false]],
      ['format',
        ['get', 'default_status_value'],
        '\n',
        ['coalesce', ['get', 'default_status_label'], ['get', 'default_status_value']],
        '\n',
      ],
      ['==', ['get', 'show_map_names'], true],
      ['format',
        'icon',
        { 'font-scale': 1.3 },
        '\n',
        ['get', 'name'],
        '\n',
      ],

      ['format',
        'icon',
        { 'font-scale': 1.3 },
        '\n',
      ],
    ],
  },
  paint: {
    'text-color': 'transparent',
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
      ['all', ['==', ['get', 'image'], null], ['has', 'default_status_value']],
      ['literal', [0, -2.5]],
      ['==', ['has', 'default_status_value'], false],
      ['literal', [0, -2.6]],
      ['literal', [0, -1.9]],
    ],
    'icon-offset': [
      'case',
      ['all', ['has', 'default_status_value'], ['==', ['get', 'data_map_id_simplified'], false], ['==', ['get', 'show_map_names'], true]],
      ['literal', [0, -50]],
      ['all', ['has', 'default_status_value'], ['==', ['get', 'data_map_id_simplified'], false]],
      ['literal', [0, -16]],
      ['all', ['has', 'default_status_value'], ['==', ['get', 'data_map_id_simplified'], true]],
      ['literal', [0, -4]],
      ['literal', [0, 7]],
    ],
    'icon-anchor': 'top',
    'text-anchor': 'center',
    'text-justify': 'center',
    'text-field': [
      'case',

      ['all', ['!=', ['get', 'image'], null], ['==', ['get', 'data_map_id_simplified'], true]],
      '',

      ['all', ['==', ['get', 'image'], null], ['==', ['has', 'default_status_value'], false]],
      ['get', 'name'],

      ['all', ['==', ['get', 'image'], null], ['==', ['get', 'data_map_id_simplified'], false], ['==', ['get', 'show_map_names'], true]],
      ['format',
        ['get', 'default_status_value'],
        '\n',
        ['coalesce', ['get', 'default_status_label'], ''],
        '\n',
        ['get', 'name'],
      ],

      ['all', ['==', ['get', 'image'], null], ['==', ['get', 'data_map_id_simplified'], false]],
      ['format',
        ['get', 'default_status_value'],
        '\n',
        ['coalesce', ['get', 'default_status_label'], ''],
      ],
      ['all', ['==', ['has', 'default_status_value'], false], ['==', ['get', 'data_map_id_simplified'], false], ['==', ['get', 'show_map_names'], true]],
      ['get', 'name'],
      ['==', ['get', 'show_map_names'], true],
      ['format',
        ['get', 'default_status_value'],
        '\n',
        ['get', 'name'],
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