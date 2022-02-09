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
    'icon-text-fit-padding': [37, 3, -24, 0],
    'icon-text-fit': 'both',
    'icon-image': 'popup-background',
    'text-max-width': 10,
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
      ['get', 'title'],
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
        ['get', 'title'],
      ],
      // same as previous but without showing map names
      ['all', ['has', 'default_status_value'], ['==', ['get', 'data_map_id_simplified'], false]],
      ['format',
        ['get', 'default_status_value'],
        '\n',
        ['coalesce', ['get', 'default_status_label'], ['get', 'default_status_value']],
        '\n',
      ],
      // for all remaining cases but showing map names
      ['all', ['==', ['get', 'data_map_id_simplified'], false], ['==', ['get', 'show_map_names'], true]],
      ['format',
        'icon',
        { 'font-scale': 1.3 },
        '\n',
        ['get', 'title'],
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
      ['literal', [0, -2.4]],
      ['all', ['==', ['get', 'image'], null], ['==', ['has', 'default_status_value'], false]],
      ['literal', [0, -2.6]],
      ['all',  ['==', ['has', 'default_status_value'], false], ['==', ['get', 'data_map_id_simplified'], false], ['==', ['get', 'show_map_names'], true]],
      ['literal', [0, -1.3]],
      ['literal', [0, -1.7]],
    ],
    'icon-offset': [
      'case',
      ['all', ['has', 'default_status_value'], ['==', ['get', 'data_map_id_simplified'], false], ['==', ['get', 'show_map_names'], true]],
      ['literal', [0, -135]],
      ['all', ['has', 'default_status_value'], ['==', ['get', 'data_map_id_simplified'], false]],
      ['literal', [0, -120]],
      ['all', ['has', 'default_status_value'], ['==', ['get', 'data_map_id_simplified'], true]],
      ['literal', [0, -110]],
      ['all', ['==', ['get', 'data_map_id_simplified'], false], ['==', ['get', 'show_map_names'], true]],
      ['literal', [0, -113]],
      ['literal', [0, -97]],
    ],
    'icon-anchor': 'top',
    'text-anchor': 'center',
    'text-justify': 'center',
    'text-max-width': 9,
    'symbol-placement': 'point',
    'text-field': [
      'case',

      ['all', ['!=', ['get', 'image'], null], ['==', ['get', 'data_map_id_simplified'], true]],
      '',

      ['all', ['==', ['get', 'image'], null], ['==', ['has', 'default_status_value'], false]],
      ['get', 'title'],

      ['all', ['==', ['get', 'image'], null], ['==', ['get', 'data_map_id_simplified'], false], ['==', ['get', 'show_map_names'], true]],
      ['format',
        ['get', 'default_status_value'],
        '\n',
        ['coalesce', ['get', 'default_status_label'], ''],
        '\n',
        ['get', 'title'],
      ],

      ['all', ['==', ['get', 'image'], null], ['==', ['get', 'data_map_id_simplified'], false]],
      ['format',
        ['get', 'default_status_value'],
        '\n',
        ['coalesce', ['get', 'default_status_label'], ''],
      ],
      ['all', ['==', ['has', 'default_status_value'], false], ['==', ['get', 'data_map_id_simplified'], false], ['==', ['get', 'show_map_names'], true]],
      ['get', 'title'],
      ['all', ['==', ['get', 'data_map_id_simplified'], false], ['==', ['get', 'show_map_names'], true]],
      ['format',
        ['get', 'default_status_value'],
        '\n',
        ['get', 'title'],
      ],
      ['get', 'default_status_value'],
    ]
  },
  paint: {
    'text-color': '#ffffff',
    'icon-color': '#ffffff',
    'text-halo-width': 0,
    'icon-halo-width': 0,
  }
};