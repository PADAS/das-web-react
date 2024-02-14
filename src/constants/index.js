import { toast } from 'react-toastify';
import es from 'date-fns/locale/es';
import enUS from 'date-fns/locale/en-US';

import * as packageJson from '../../package.json';
import layoutVariables from '../common/styles/layout.module.scss';

const { POSITION: TOAST_POSITIONS } = toast;
const { buildbranch, buildnum } = packageJson;

export const {
  REACT_APP_DAS_AUTH_TOKEN_URL,
  REACT_APP_MAPBOX_TOKEN,
  REACT_APP_DAS_API_URL,
  REACT_APP_ROUTE_PREFIX,
  REACT_APP_GA_TRACKING_ID,
  REACT_APP_GA4_TRACKING_ID,
  REACT_APP_BASE_MAP_STYLES,
  REACT_APP_DEFAULT_EVENT_FILTER_FROM_DAYS,
  REACT_APP_DEFAULT_PATROL_FILTER_FROM_DAYS,
} = process.env;

export const DAS_HOST = process.env.REACT_APP_DAS_HOST
  || `${window.location.protocol}//${window.location.host}`;

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
export const MAX_ZOOM = 20;

export const CLUSTER_CLICK_ZOOM_THRESHOLD = 13;
export const CLUSTERS_MAX_ZOOM = MAX_ZOOM - 1;
export const CLUSTERS_RADIUS = 40;

export const EVENT_FILTER_SCHEMA_HIDDEN_PROPS = ['event_filter_id', 'duration'];

export const API_URL = `${DAS_HOST}${REACT_APP_DAS_API_URL}`;

export const STATUSES = {
  HEALTHY_STATUS: 'HEALTHY',
  WARNING_STATUS: 'WARNING',
  UNHEALTHY_STATUS: 'UNHEALTHY',
  UNKNOWN_STATUS: 'UNKNOWN',
};

/** ToDo: remove title once all translations related with this const are done */
export const PATROL_UI_STATES = {
  SCHEDULED: { key: 'scheduled', title: 'Scheduled', status: 'scheduled' },
  READY_TO_START: { key: 'readyToStart', title: 'Ready to start', status: 'ready' },
  ACTIVE: { key: 'active', title: 'Active', status: 'open' },
  DONE: { key: 'done', title: 'Done', status: 'done' },
  START_OVERDUE: { key: 'startOverdue', title: 'Start Overdue', status: 'start-overdue' },
  CANCELLED: { key: 'cancelled', title: 'Cancelled', status: 'cancelled' },
  INVALID: { key: 'invalid', title: 'Invalid Configuration', status: 'cancelled' },
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
  SETTINGS: 'settings',
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
  EVENT_GEOMETRY_LAYER: 'event-geometry-layer',
  TOPMOST_STYLE_LAYER: 'feature-separation-layer',
  SKY_LAYER: 'sky',
  CLUSTER_BUFFER_POLYGON_LAYER_ID: 'cluster-buffer-polygon-layer',
  CLUSTERS_LAYER_ID: 'clusters-layer',
  FEATURE_FILLS: 'feature-fills',
  FEATURE_SYMBOLS: 'feature-symbols',
  FEATURE_LINES: 'feature-lines',
  EVENT_CLUSTER_COUNT_SYMBOLS: 'event_cluster_count',
  EVENT_SYMBOLS: 'event_symbols',
  SUBJECT_SYMBOLS: 'subject-symbol-layer',
  STATIC_SENSOR: 'static_sensor',
  CLUSTERED_STATIC_SENSORS_LAYER: 'clustered_static_sensors_layer',
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
  MOUSE_MARKER_LAYER: 'mouse-marker-layer',
};

export const SOURCE_IDS = {
  ANALYZER_POLYS_WARNING_SOURCE: 'analyzer-polygon-warning-source',
  ANALYZER_POLYS_CRITICAL_SOURCE: 'analyzer-polygon-critical-source',
  ANALYZER_LINES_WARNING_SOURCE: 'analyzer-line-warning-source',
  ANALYZER_LINES_CRITICAL_SOURCE: 'analyzer-line-critical-source',
  SUBJECT_SYMBOLS: 'subject-symbol-source',
  CLUSTER_BUFFER_POLYGON_SOURCE_ID: 'cluster-buffer-polygon-source',
  CLUSTERS_SOURCE_ID: 'clusters-source',
  EVENT_GEOMETRY: 'event-geometry-source',
  UNCLUSTERED_EVENTS_SOURCE: 'events-data-unclustered',
  MAP_FEATURES_LINES_SOURCE: 'feature-line-source',
  MAP_FEATURES_POLYGONS_SOURCE: 'feature-polygon-source',
  MAP_FEATURES_SYMBOLS_SOURCE: 'feature-symbol-source',
  MOUSE_MARKER_SOURCE: 'mouse-marker-source',
  CURRENT_USER_LOCATION_SOURCE: 'current-user-location-source',
};

export const DEFAULT_SHOW_NAMES_IN_MAP_CONFIG = {
  [LAYER_IDS.SUBJECT_SYMBOLS]: { key: 'subjects', enabled: true },
  [LAYER_IDS.STATIC_SENSOR]: { key: 'stationary_subjects', enabled: false },
  [LAYER_IDS.EVENT_SYMBOLS]: { key: 'reports', enabled: true },
  [LAYER_IDS.PATROL_SYMBOLS]: { key: 'patrols', enabled: true },
};

export const LAYER_PICKER_IDS = [
  LAYER_IDS.ANALYZER_POLYS_WARNING_SOURCE, LAYER_IDS.ANALYZER_POLYS_CRITICAL_SOURCE,
  LAYER_IDS.ANALYZER_LINES_CRITICAL_SOURCE, LAYER_IDS.ANALYZER_LINES_WARNING_SOURCE,
  LAYER_IDS.EVENT_SYMBOLS, LAYER_IDS.SUBJECT_SYMBOLS, `${LAYER_IDS.EVENT_SYMBOLS}-labels`, `${LAYER_IDS.SUBJECT_SYMBOLS}-labels`,
  LAYER_IDS.EVENT_GEOMETRY_LAYER,
];

export const SYSTEM_CONFIG_FLAGS = {
  PATROL_MANAGEMENT: 'patrol_enabled',
  ALERTS: 'alerts_enabled',
  DAILY_REPORT: 'daily_report_enabled',
  EVENT_MATRIX: 'event_matrix_enabled',
  EULA: 'eula_enabled',
  KML_EXPORT: 'export_kml_enabled',
  TABLEAU: 'tableau_enabled',
  GEOPERMISSIONS: 'geopermissions_enabled',
  DEFAULT_EVENT_FILTER_FROM_DAYS: 'default_event_filter_from_days',
  DEFAULT_PATROL_FILTER_FROM_DAYS: 'default_patrol_filter_from_days',
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
    value: ['active', 'new'],
    key: 'active'
  },
  {
    label: 'Resolved',
    value: ['resolved'],
    key: 'resolved'
  },
  {
    label: 'All',
    value: null,
    key: 'all'
  },
];

export const EVENT_FORM_STATES = {
  ACTIVE: 'active',
  NEW_LEGACY: 'new',
  RESOLVED: 'resolved',
};

// TODO i18n: Remove the display values once all translations are done
export const REPORT_PRIORITY_HIGH = {
  display: 'Red',
  key: 'red',
  value: 300,
};

export const REPORT_PRIORITY_MEDIUM = {
  display: 'Amber',
  key: 'amber',
  value: 200,
};

export const REPORT_PRIORITY_LOW = {
  display: 'Green',
  key: 'green',
  value: 100,
};

export const REPORT_PRIORITY_NONE = {
  display: 'None',
  key: 'none',
  value: 0,
};

export const REPORT_PRIORITIES = [
  REPORT_PRIORITY_HIGH,
  REPORT_PRIORITY_MEDIUM,
  REPORT_PRIORITY_LOW,
  REPORT_PRIORITY_NONE
];

export const DATEPICKER_DEFAULT_CONFIG = {
  dateFormat: 'yyyy-MM-dd HH:mm',
  minDate: new Date('2000-01-01'),
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

export const ASCENDING_SORT_ORDER = 'asc';
export const DESCENDING_SORT_ORDER = 'desc';

export const VALID_EVENT_GEOMETRY_TYPES = {
  POLYGON: 'Polygon',
  POINT: 'Point',
};

export const SUPPORTED_LANGUAGES = {
  'en-US': 'English (United States)',
  es: 'Español',
};

export const FEATURE_FLAG_LABELS = {
  ENABLE_PATROL_NEW_UI: 'ENABLE_PATROL_NEW_UI',
  I18N_ENABLED: 'I18N_ENABLED',
  LEGACY_RT_ENABLED: 'LEGACY_RT_ENABLED',
};

export const DEVELOPMENT_FEATURE_FLAGS = {
  [FEATURE_FLAG_LABELS.ENABLE_PATROL_NEW_UI]: process.env.REACT_APP_ENABLE_PATROL_NEW_UI === 'true',
  [FEATURE_FLAG_LABELS.I18N_ENABLED]: process.env.REACT_APP_I18N_ENABLED === 'true',
  [FEATURE_FLAG_LABELS.LEGACY_RT_ENABLED]: process.env.REACT_APP_LEGACY_RT_ENABLED === 'true',
};

export const DATE_LOCALES = {
  'es': es,
  'en-US': enUS
};
