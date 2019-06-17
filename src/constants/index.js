import { calcLayerName } from '../utils/map';

export const {
  REACT_APP_DAS_HOST,
  REACT_APP_DAS_AUTH_TOKEN_URL,
  REACT_APP_MAPBOX_TOKEN,
  REACT_APP_DAS_API_URL,
  REACT_APP_ROUTE_PREFIX,
} = process.env;

export const EVENT_FILTER_SCHEMA_HIDDEN_PROPS = ['event_filter_id', 'duration'];

export const API_URL = `${REACT_APP_DAS_HOST}${REACT_APP_DAS_API_URL}`;

export const STATUSES = {
  HEALTHY_STATUS: 'HEALTHY',
  WARNING_STATUS: 'WARNING',
  UNHEALTHY_STATUS: 'UNHEALTHY',
  UNKNOWN_STATUS: 'UNKNOWN',
};

export const MAP_ICON_SIZE = 28;

// keep this in sync with `/common/styles/_layout.scss`
const mdLayoutWidthMin = '(min-width: 31.75rem)';
const lgLayoutWidthMin = '(min-width: 48rem)';
const mdLayoutWidthMax = `(max-width: calc(${lgLayoutWidthMin} - 1px))`;

export const BREAKPOINTS = {
  screenIsMediumLayoutOrLarger: matchMedia(mdLayoutWidthMin),
  screenIsSmallerThanLargeLayout: matchMedia(mdLayoutWidthMax),
  screenIsLargeLayoutOrLarger: matchMedia(lgLayoutWidthMin),
};

export const LAYER_IDS = {
  FEATURE_FILLS: 'feature-fills',
  FEATURE_SYMBOLS: 'feature-symbols',
  FEATURE_LINES: 'feature-lines',
  EVENT_CLUSTERS_CIRCLES: 'event_clusters',
  EVENT_CLUSTER_COUNT_SYMBOLS: 'event_cluster_count',
  EVENT_SYMBOLS: 'event_symbols',
  SUBJECT_SYMBOLS: 'subject_symbols',
  TRACKS_LINES: 'track-layer',
  TRACK_TIMEPOINTS_SYMBOLS: 'track-layer-timepoints',
  HEATMAP_LAYER: 'heatmap',
};

export const GENERATED_LAYER_IDS = Object.entries(LAYER_IDS).reduce((output, [key, value]) => {
  output[key] = calcLayerName(key, value);
  return output;
}, {});


export const DEFAULT_SYMBOL_LAYOUT = {
  'icon-allow-overlap': ['step', ['zoom'], false, 11, true],
  'icon-anchor': 'center',
  'icon-image': ['get', 'icon_id'],
  'icon-size': [
    'interpolate', ['linear'], ['zoom'],
    0, 0,
    13, 1,
  ],
  'text-allow-overlap': ['step', ['zoom'], false, 11, true],
  'text-anchor': 'top',
  'text-offset': [0, .5],
  'text-field': '{title}',
  'text-justify': 'center',
  'text-size': [
    'interpolate', ['linear'], ['zoom'],
    0, 8,
    12, 14,
  ],
};

export const EVENT_STATE_CHOICES = [
  {
    label: 'Active',
    value: ['active', 'new'],
  },
  {
    label: 'Resolved',
    value: ['resolved'],
  },
  {
    label: 'All',
    value: null,
  },
];

export const REPORT_PRIORITIES = [
  {
    display: 'Red',
    value: 300,
  },
  {
    display: 'Amber',
    value: 200,
  },
  {
    display: 'Green',
    value: 100,
  },
  {
    display: 'None',
    value: 0,
  },
];

export const DATEPICKER_DEFAULT_CONFIG = {
  disableClock: true,
  format: 'dd-MM-yyyy HH:mm',
};