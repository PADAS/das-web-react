import { toast } from 'react-toastify';

import { INITIAL_FILTER_STATE } from '../ducks/event-filter';

import layoutVariables from '../common/styles/_layout.scss';

const { POSITION: TOAST_POSITIONS } = toast;

export const {
  REACT_APP_DAS_HOST,
  REACT_APP_DAS_AUTH_TOKEN_URL,
  REACT_APP_MAPBOX_TOKEN,
  REACT_APP_DAS_API_URL,
  REACT_APP_ROUTE_PREFIX,
  REACT_APP_GA_TRACKING_ID,
  REACT_APP_BASE_MAP_STYLES,
} = process.env;

export const GA_EVENT_CATEGORIES = {
  EVENT_REPORTS: 'Event Reports',
  REPORT_EXPORT: 'Report Export',
  MAP_INTERATION: 'Map Interaction',
  MAP_LAYERS: 'Map Layers',
  FEED: 'Feed',
  TABS: 'Tabs',
  DRAWER: 'Drawer',
  GPS_FORMAT: 'GPS Format',
  SYSTEM_STATUS: 'System Status',
};

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 18;

export const FIT_TO_BOUNDS_PADDING = 50;

export const EVENT_FILTER_SCHEMA_HIDDEN_PROPS = ['event_filter_id', 'duration'];

export const API_URL = `${REACT_APP_DAS_HOST}${REACT_APP_DAS_API_URL}`;

export const STATUSES = {
  HEALTHY_STATUS: 'HEALTHY',
  WARNING_STATUS: 'WARNING',
  UNHEALTHY_STATUS: 'UNHEALTHY',
  UNKNOWN_STATUS: 'UNKNOWN',
};

export const MAP_ICON_SIZE = 30;
export const MAP_ICON_SCALE = 2;

// keep this in sync with `/common/styles/_layout.scss`
const mdLayoutWidthMax = `(max-width: ${layoutVariables.mediumWidthMax}`;
const mdLayoutWidthMin = `(min-width: ${layoutVariables.mediumWidthMin})`;
const lgLayoutWidthMin = `(min-width: ${layoutVariables.largeWidthMin})`;
const xlLayoutWidthMin = `(min-width: ${layoutVariables.extraLargeWidthMin})`;

export const BREAKPOINTS = {
  screenIsMediumLayoutOrLarger: matchMedia(mdLayoutWidthMin),
  screenIsSmallerThanLargeLayout: matchMedia(mdLayoutWidthMax),
  screenIsLargeLayoutOrLarger: matchMedia(lgLayoutWidthMin),
  screenIsExtraLargeWidth: matchMedia(xlLayoutWidthMin),
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
  ANALYZER_POLYS_WARNING: 'analyzer-polygon-warning',
  ANALYZER_POLYS_CRITICAL: 'analyzer-polygon-critical',
  ANALYZER_LINES_WARNING: 'analyzer-line-warning',
  ANALYZER_LINES_CRITICAL: 'analyzer-line-critical',
  ISOCHRONE_LAYER: 'isochrone',
};

export const SOURCE_IDS = {
  ANALYZER_POLYS_WARNING_SOURCE: 'analyzer-polygon-warning-source',
  ANALYZER_POLYS_CRITICAL_SOURCE: 'analyzer-polygon-critical-source',
  ANALYZER_LINES_WARNING_SOURCE: 'analyzer-line-warning-source',
  ANALYZER_LINES_CRITICAL_SOURCE: 'analyzer-line-critical-source',
};

export const IF_IS_GENERIC = (ifGeneric, ifNonGeneric) => ['case',
  ['in', 'generic', ['get', 'image']], ifGeneric,
  ifNonGeneric,
];

export const SYMBOL_ICON_SIZE_EXPRESSION = [
  'interpolate', ['exponential', 0.5], ['zoom'],
  6, 0,
  12, IF_IS_GENERIC(0.5/MAP_ICON_SCALE, 1/MAP_ICON_SCALE),
  MAX_ZOOM, IF_IS_GENERIC(0.75/MAP_ICON_SCALE, 1.5/MAP_ICON_SCALE),
];

export const symbolTextSize = [
  'interpolate', ['exponential', 0.5], ['zoom'],
  6, 0,
  12, 14,
  MAX_ZOOM, 16,
];

export const DEFAULT_SYMBOL_LAYOUT = {
  'icon-allow-overlap': ['step', ['zoom'], false, 10, true],
  'icon-anchor': 'center',
  'icon-image': ['get', 'image'],
  'icon-size': SYMBOL_ICON_SIZE_EXPRESSION,
  'text-allow-overlap': ['step', ['zoom'], false, 10, true],
  'text-anchor': 'top',
  'text-offset': [0, .75],
  'text-field': '{title}',
  'text-justify': 'center',
  'text-size': symbolTextSize,
};

export const DEFAULT_SYMBOL_PAINT = {
  'text-halo-color': 'rgba(255,255,255,0.95)',
  'text-halo-width': [
    'interpolate', ['exponential', 0.5], ['zoom'],
    6, 1,
    12, 3,
  ],
  'text-halo-blur': 3,
  'text-translate-anchor': 'viewport'
};

export const EVENT_STATE_CHOICES = [
  {
    label: 'Active',
    value: INITIAL_FILTER_STATE.state,
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

export const DEFAULT_SELECT_STYLES = {
  option(styles, state) {
    const { isDisabled, isFocused } = state;
    return {
      ...styles,
      backgroundColor: isDisabled ? 'gray' : (isFocused ? '#006cd9' : 'white'),
      color: isFocused ? 'white' : 'inherit',
      cursor: isDisabled ? 'not-allowed' : 'default',
    };
  },
  menu(styles, state) {
    return {
      ...styles,
      zIndex: 5,
    };
  }
};

export const DATEPICKER_DEFAULT_CONFIG = {
  disableClock: true,
  clearIcon: null,
  calendarIcon: null,
  format: 'dd-MM-yyyy HH:mm',
};

export const GEOLOCATOR_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
};

export const DEFAULT_TOAST_CONFIG = {
  position: TOAST_POSITIONS.TOP_CENTER,
};

export const MAPBOX_STYLE_LAYER_SOURCE_TYPES = ['mapbox_style'];
export const GOOGLE_LAYER_SOURCE_TYPES = ['google_map'];
export const TILE_LAYER_SOURCE_TYPES = ['tile_server', 'mapbox_tiles'];
export const VALID_LAYER_SOURCE_TYPES = [...MAPBOX_STYLE_LAYER_SOURCE_TYPES, /* ...GOOGLE_LAYER_SOURCE_TYPES, */ ...TILE_LAYER_SOURCE_TYPES];

export const DEFAULT_SHOW_TRACK_DAYS = 7;


export const COLUMN_CLASS_PREFIXES = {
  sm: 'col-sm-',
  md: 'col-md-',
  lg: 'col-lg-',
};
