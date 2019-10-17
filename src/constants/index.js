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

export const EVENT_FILTER_SCHEMA_HIDDEN_PROPS = ['event_filter_id', 'duration'];

export const API_URL = `${REACT_APP_DAS_HOST}${REACT_APP_DAS_API_URL}`;

export const STATUSES = {
  HEALTHY_STATUS: 'HEALTHY',
  WARNING_STATUS: 'WARNING',
  UNHEALTHY_STATUS: 'UNHEALTHY',
  UNKNOWN_STATUS: 'UNKNOWN',
};

export const MAP_ICON_SIZE = 30;

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
  ANALYZER_POLYS_WARNING: 'analyzer-polys-warning',
  ANALYZER_POLYS_CRITICAL: 'analyzer-polys-critical',
  ANALYZER_LINES_WARNING: 'analyzer-lines-warning',
  ANALYZER_LINES_CRITICAL: 'analyzer-lines-critical',
  ISOCHRONE_LAYER: 'isochrone',
};

export const DEFAULT_SYMBOL_LAYOUT = {
  'icon-allow-overlap': ['step', ['zoom'], false, 10, true],
  'icon-anchor': 'center',
  'icon-image': ['get', 'icon_id'],
  'icon-size': [
    'interpolate', ['exponential', 0.5], ['zoom'],
    7, 0,
    12, 1,
    MAX_ZOOM, 1.5,
  ],
  'text-allow-overlap': ['step', ['zoom'], false, 10, true],
  'text-anchor': 'top',
  'text-offset': [0, .75],
  'text-field': '{title}',
  'text-justify': 'center',
  'text-size': [
    'interpolate', ['exponential', 0.5], ['zoom'],
    6, 0,
    12, 14,
    MAX_ZOOM, 16,
  ],
};

export const DEFAULT_SYMBOL_PAINT = {
  'text-halo-color': 'rgba(255,255,255,0.7)',
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
};

export const DATEPICKER_DEFAULT_CONFIG = {
  disableClock: false,
  clearIcon: null,
  calendarIcon: null,
  format: 'dd-MM-yyyy HH:mm',
};

export const GEOLOCATOR_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
};

export const MAPBOX_STYLE_LAYER_SOURCE_TYPES = ['mapbox_style'];
export const GOOGLE_LAYER_SOURCE_TYPES = ['google_map'];
export const TILE_LAYER_SOURCE_TYPES = ['tile_server', 'mapbox_tiles'];
export const VALID_LAYER_SOURCE_TYPES = [...MAPBOX_STYLE_LAYER_SOURCE_TYPES, /* ...GOOGLE_LAYER_SOURCE_TYPES, */ ...TILE_LAYER_SOURCE_TYPES];

export const DEFAULT_SHOW_TRACK_DAYS = 7;
