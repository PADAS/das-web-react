import { toast } from 'react-toastify';

import * as packageJson from '../../package.json';
import { INITIAL_FILTER_STATE } from '../ducks/event-filter';

import layoutVariables from '../common/styles/layout.module.scss';

const { POSITION: TOAST_POSITIONS } = toast;
const { buildbranch, buildnum } = packageJson;

export const {
  REACT_APP_DAS_HOST,
  REACT_APP_DAS_AUTH_TOKEN_URL,
  REACT_APP_MAPBOX_TOKEN,
  REACT_APP_DAS_API_URL,
  REACT_APP_ROUTE_PREFIX,
  REACT_APP_GA_TRACKING_ID,
  REACT_APP_BASE_MAP_STYLES,
} = process.env;

export const CLIENT_BUILD_VERSION = `${buildbranch}-${buildnum}`;

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

export const MIN_ZOOM = 2.5;
export const MAX_ZOOM = 18;

export const CLUSTER_CLICK_ZOOM_THRESHOLD = 13;
export const CLUSTERS_MAX_ZOOM = MAX_ZOOM - 1;
export const CLUSTERS_RADIUS = 40;

export const FIT_TO_BOUNDS_PADDING = 50;

export const EVENT_FILTER_SCHEMA_HIDDEN_PROPS = ['event_filter_id', 'duration'];

export const API_URL = `${REACT_APP_DAS_HOST}${REACT_APP_DAS_API_URL}`;

export const STATUSES = {
  HEALTHY_STATUS: 'HEALTHY',
  WARNING_STATUS: 'WARNING',
  UNHEALTHY_STATUS: 'UNHEALTHY',
  UNKNOWN_STATUS: 'UNKNOWN',
};

export const PATROL_UI_STATES = {
  SCHEDULED: { title: 'Scheduled', status: 'scheduled' },
  READY_TO_START: { title: 'Ready to Start', status: 'ready' },
  ACTIVE: { title: 'Active', status: 'open' },
  DONE: { title: 'Done', status: 'done' },
  START_OVERDUE: { title: 'Start Overdue', status: 'start-overdue' },
  CANCELLED: { title: 'Cancelled', status: 'cancelled' },
  INVALID: { title: 'Invalid Configuration', status: 'cancelled' },
};

export const PATROL_API_STATES = {
  OPEN: 'open',
  DONE: 'done',
  CANCELLED: 'cancelled',
};

export const TAB_KEYS = {
  REPORTS: 'reports',
  LAYERS: 'layers',
  PATROLS: 'patrols',
};

export const MAP_ICON_SIZE = 30;
export const MAP_ICON_SCALE = 2;

// keep this in sync with `/common/styles/_layout.scss`
const mdLayoutWidthMax = `(max-width: ${layoutVariables.mediumWidthMax}`;
const mdLayoutWidthMin = `(min-width: ${layoutVariables.mediumWidthMin})`;
const lgLayoutWidthMin = `(min-width: ${layoutVariables.largeWidthMin})`;
const xlLayoutWidthMin = `(min-width: ${layoutVariables.extraLargeWidthMin})`;

export const BREAKPOINTS = {
  screenIsMediumLayoutOrLarger: window.matchMedia(mdLayoutWidthMin),
  screenIsSmallerThanLargeLayout: window.matchMedia(mdLayoutWidthMax),
  screenIsLargeLayoutOrLarger: window.matchMedia(lgLayoutWidthMin),
  screenIsExtraLargeWidth: window.matchMedia(xlLayoutWidthMin),
};

export const LAYER_IDS = {
  TOPMOST_STYLE_LAYER: 'feature-separation-layer',
  CLUSTER_BUFFER_POLYGON_LAYER_ID: 'cluster-buffer-polygon-layer',
  CLUSTER_BUFFER_POLYGON_SOURCE_ID: 'cluster-buffer-polygon-source',
  CLUSTERS_LAYER_ID: 'clusters-layer',
  CLUSTERS_SOURCE_ID: 'clusters-source',
  FEATURE_FILLS: 'feature-fills',
  FEATURE_SYMBOLS: 'feature-symbols',
  FEATURE_LINES: 'feature-lines',
  EVENT_CLUSTERS_CIRCLES: 'event_clusters',
  EVENT_CLUSTER_COUNT_SYMBOLS: 'event_cluster_count',
  EVENT_SYMBOLS: 'event_symbols',
  SUBJECT_SYMBOLS: 'subject_symbols',
  STATIC_SENSOR: 'static_sensor',
  UNCLUSTERED_STATIC_SENSORS_LAYER: 'unclustered_static_sensors_layer',
  SECOND_STATIC_SENSOR_PREFIX: 'icons-layer-',
  PATROL_SYMBOLS: 'patrol_symbols',
  TRACKS_LINES: 'track-layer',
  TRACK_TIMEPOINTS_SYMBOLS: 'track-layer-timepoints',
  HEATMAP_LAYER: 'heatmap',
  ANALYZER_POLYS_WARNING: 'analyzer-polygon-warning',
  ANALYZER_POLYS_CRITICAL: 'analyzer-polygon-critical',
  ANALYZER_LINES_WARNING: 'analyzer-line-warning',
  ANALYZER_LINES_CRITICAL: 'analyzer-line-critical',
  ISOCHRONE_LAYER: 'isochrone',
};

export const DEFAULT_SHOW_NAMES_IN_MAP_CONFIG = {
  [LAYER_IDS.SUBJECT_SYMBOLS]: { label: 'Subjects', enabled: true },
  [LAYER_IDS.STATIC_SENSOR]: { label: 'Stationary Subjects', enabled: false },
  [LAYER_IDS.EVENT_SYMBOLS]: { label: 'Reports', enabled: true },
};

export const LAYER_PICKER_IDS = [
  LAYER_IDS.ANALYZER_POLYS_WARNING_SOURCE, LAYER_IDS.ANALYZER_POLYS_CRITICAL_SOURCE,
  LAYER_IDS.ANALYZER_LINES_CRITICAL_SOURCE, LAYER_IDS.ANALYZER_LINES_WARNING_SOURCE,
  LAYER_IDS.EVENT_SYMBOLS, LAYER_IDS.SUBJECT_SYMBOLS, `${LAYER_IDS.EVENT_SYMBOLS}-labels`, `${LAYER_IDS.SUBJECT_SYMBOLS}-labels`
];

export const FEATURE_FLAGS = {
  PATROL_MANAGEMENT: 'patrol_enabled',
  ALERTS: 'alerts_enabled',
  DAILY_REPORT: 'daily_report_enabled',
  EVENT_MATRIX: 'event_matrix_enabled',
  EULA: 'eula_enabled',
  KML_EXPORT: 'export_kml_enabled',
  TABLEAU: 'tableau_enabled',
  GEOPERMISSIONS: 'geopermissions_enabled',
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
  0, IF_IS_GENERIC(0.1/MAP_ICON_SCALE, 0.2/MAP_ICON_SCALE),
  14, IF_IS_GENERIC(0.5/MAP_ICON_SCALE, 1/MAP_ICON_SCALE),
  // MAX_ZOOM, IF_IS_GENERIC(0.75/MAP_ICON_SCALE, 1.1/MAP_ICON_SCALE),
];

export const SYMBOL_TEXT_SIZE_EXPRESSION = [
  'interpolate', ['exponential', 0.5], ['zoom'],
  0, 5,
  6, 8,
  14, 13,
];

export const DEFAULT_SYMBOL_LAYOUT = {
  'icon-allow-overlap': ['step', ['zoom'], false, 10, true],
  'icon-anchor': 'center',
  'icon-image': ['concat',
    ['get', 'image'], '-',
    ['case',
      ['has', 'width'], ['get', 'width'],
      'x'],
    '-',
    ['case',
      ['has', 'height'], ['get', 'height'],
      'x'],
  ],
  /* keep the above icon-image expression aligned with the output of `calcImgIdFromUrlForMapImages`, found in utils/img */
  'icon-size': SYMBOL_ICON_SIZE_EXPRESSION,
  'text-allow-overlap': ['step', ['zoom'], false, 10, true],
  'text-anchor': 'top',
  'text-offset': [0, .75],
  'text-field': '{title}',
  'text-justify': 'center',
  'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
  'text-size': SYMBOL_TEXT_SIZE_EXPRESSION,
};

export const DEFAULT_SYMBOL_PAINT = {
  'text-halo-color': 'rgba(255,255,255,0.7)',
  'text-halo-width': 1,
  'text-halo-blur': 1,
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
      backgroundColor: isFocused ? '#006cd9' : 'white',
      color: isFocused ? 'white' : 'inherit',
      display: isDisabled ? 'none' : 'block',
    };
  },
  menu(styles) {
    return {
      ...styles,
      zIndex: 5,
    };
  }
};

export const DATEPICKER_DEFAULT_CONFIG = {
  calendarIcon: null,
  dateFormat: 'yyyy-MM-dd HH:mm',
  minDate: new Date('2010-01-01'),
};

export const GEOLOCATOR_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
};

export const DEFAULT_TOAST_CONFIG = {
  closeOnClick: false,
  position: TOAST_POSITIONS.TOP_RIGHT,
  type: toast.TYPE.ERROR,
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

export const EXTERNAL_SAME_DOMAIN_ROUTES = [
  '/admin',
  '/admin/',
];

export const PERMISSION_KEYS = {
  PATROLS: 'patrol',
  PATROL_TYPES: 'patroltype',
  MESSAGING: 'message',
};


export const PERMISSIONS = {
  CREATE: 'add',
  READ: 'view',
  UPDATE: 'change',
  DELETE: 'delete',
};

export const SUBJECT_FEATURE_CONTENT_TYPE = 'observations.subject';

export const DEVELOPMENT_FEATURE_FLAGS = {
  ENABLE_NEW_CLUSTERING: process.env.REACT_APP_ENABLE_NEW_CLUSTERING === 'true',
  ENABLE_PATROL_NEW_UI: process.env.REACT_APP_ENABLE_PATROL_NEW_UI === 'true',
  ENABLE_REPORT_NEW_UI: process.env.REACT_APP_ENABLE_REPORT_NEW_UI === 'true',
  ENABLE_UFA_NAVIGATION_UI: process.env.REACT_APP_ENABLE_UFA_NAVIGATION_UI === 'true',
  ENABLE_GEOPERMISSION_UI: process.env.REACT_APP_ENABLE_GEOPERMISSION_UI === 'true',
};
