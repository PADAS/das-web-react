import * as packageJson from '../../package.json';
import * as layoutVariables from '../common/styles/layout.module.scss';

const { buildbranch, buildnum } = packageJson;

export const REACT_APP_DAS_AUTH_TOKEN_URL = import.meta.env.REACT_APP_DAS_AUTH_TOKEN_URL;
export const REACT_APP_MAPBOX_TOKEN = import.meta.env.REACT_APP_MAPBOX_TOKEN;
export const REACT_APP_DAS_API_URL = import.meta.env.REACT_APP_DAS_API_URL;
export const REACT_APP_DAS_API_V2_URL = import.meta.env.REACT_APP_DAS_API_V2_URL;
export const REACT_APP_ROUTE_PREFIX = import.meta.env.REACT_APP_ROUTE_PREFIX;
export const REACT_APP_GA4_TRACKING_ID = import.meta.env.REACT_APP_GA4_TRACKING_ID;
export const REACT_APP_BASE_MAP_STYLES = import.meta.env.REACT_APP_BASE_MAP_STYLES;
export const REACT_APP_DEFAULT_EVENT_FILTER_FROM_DAYS = import.meta.env.REACT_APP_DEFAULT_EVENT_FILTER_FROM_DAYS;
export const REACT_APP_DEFAULT_PATROL_FILTER_FROM_DAYS = import.meta.env.REACT_APP_DEFAULT_PATROL_FILTER_FROM_DAYS;

export const DAS_HOST = import.meta.env.REACT_APP_DAS_HOST
  || `${window.location.protocol}//${window.location.host}`;

export const CLIENT_BUILD_VERSION = `${buildbranch}-${buildnum}`;

export const MIN_ZOOM = 2.5;
export const MAX_ZOOM = 20;

export const CLUSTER_CLICK_ZOOM_THRESHOLD = 13;
export const CLUSTERS_MAX_ZOOM = MAX_ZOOM - 1;
export const CLUSTERS_RADIUS = 40;

export const API_URL = `${DAS_HOST}${REACT_APP_DAS_API_URL}`;
export const API_V2_URL = `${DAS_HOST}${REACT_APP_DAS_API_V2_URL}`;

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
  EVENTS: 'events',
  GEAR: 'gear',
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
  ANALYZER_LINES_CRITICAL: 'analyzer-line-critical',
  ANALYZER_LINES_WARNING: 'analyzer-line-warning',
  ANALYZER_POLYS_CRITICAL: 'analyzer-polygon-critical',
  ANALYZER_POLYS_WARNING: 'analyzer-polygon-warning',
  COORDINATE_REFERENCE_SYSTEM_BBOX: 'coordinate-reference-system-bbox-layer',
  CLUSTER_POLYGON_LAYER_ID: 'cluster-polygon-layer',
  CLUSTERED_STATIC_SENSORS_LAYER: 'clustered_static_sensors_layer',
  CLUSTERS_LAYER_ID: 'clusters-layer',
  EVENT_CLUSTER_COUNT_SYMBOLS: 'event_cluster_count',
  EVENT_GEOMETRY_LAYER: 'event-geometry-layer',
  EVENT_LOCATION_MARKERS: 'event-location-markers-layer',
  EVENT_SYMBOLS: 'event_symbols',
  GEAR_LINE: 'gear-line-layer',
  GEAR_POINT: 'gear-point-layer',
  HEATMAP_LAYER: 'heatmap',
  ISOCHRONE_LAYER: 'isochrone',
  MOUSE_MARKER_LAYER: 'mouse-marker-layer',
  PATROL_SYMBOLS: 'patrol_symbols',
  SECOND_STATIC_SENSOR_PREFIX: 'icons-layer-',
  SKY_LAYER: 'sky',
  STATIC_SENSOR: 'static_sensor',
  SUBJECT_SYMBOLS: 'subject-symbol-layer',
  TOPMOST_STYLE_LAYER: 'feature-separation-layer',
  TRACKS_LINES: 'track-layer',
  TRACKS_SOURCE: 'track-source',
  TRACK_TIMEPOINTS: 'track-layer-points',
  UNCLUSTERED_STATIC_SENSORS_LAYER: 'unclustered_static_sensors_layer',
};

export const SOURCE_IDS = {
  ANALYZER_LINES_CRITICAL_SOURCE: 'analyzer-line-critical-source',
  ANALYZER_LINES_WARNING_SOURCE: 'analyzer-line-warning-source',
  ANALYZER_POLYS_CRITICAL_SOURCE: 'analyzer-polygon-critical-source',
  ANALYZER_POLYS_WARNING_SOURCE: 'analyzer-polygon-warning-source',
  COORDINATE_REFERENCE_SYSTEM_BBOX: 'coordinate-reference-system-bbox-source',
  CLUSTER_POLYGON_SOURCE_ID: 'cluster-polygon-source',
  CLUSTERS_SOURCE_ID: 'clusters-source',
  CURRENT_USER_LOCATION_SOURCE: 'current-user-location-source',
  EVENT_GEOMETRY: 'event-geometry-source',
  EVENT_LOCATION_MARKERS: 'event-location-markers-source',
  MAP_FEATURES_LINES_SOURCE: 'feature-line-source',
  MAP_FEATURES_POLYGONS_SOURCE: 'feature-polygon-source',
  MAP_FEATURES_SYMBOLS_SOURCE: 'feature-symbol-source',
  MOUSE_MARKER_SOURCE: 'mouse-marker-source',
  GEAR_FEATURES: 'gear-features-source',
  SUBJECT_SYMBOLS: 'subject-symbol-source',
  UNCLUSTERED_EVENTS_SOURCE: 'events-data-unclustered',
};

export const DEFAULT_SHOW_NAMES_IN_MAP_CONFIG = {
  [LAYER_IDS.SUBJECT_SYMBOLS]: { key: 'subjects', enabled: true },
  [LAYER_IDS.STATIC_SENSOR]: { key: 'stationary_subjects', enabled: false },
  [LAYER_IDS.EVENT_SYMBOLS]: { key: 'reports', enabled: true },
  [LAYER_IDS.PATROL_SYMBOLS]: { key: 'patrols', enabled: true },
};

export const SYSTEM_CONFIG_FLAGS = {
  ALERTS: 'alerts_enabled',
  ANALYZERS: 'analyzers_enabled',
  DAILY_REPORT: 'daily_report_enabled',
  DEFAULT_EVENT_FILTER_FROM_DAYS: 'default_event_filter_from_days',
  DEFAULT_PATROL_FILTER_FROM_DAYS: 'default_patrol_filter_from_days',
  EULA: 'eula_enabled',
  EVENTS: 'events_enabled',
  GEAR: 'gear_enabled',
  GEOPERMISSIONS: 'geopermissions_enabled',
  KML_EXPORT: 'export_kml_enabled',
  PATROL_MANAGEMENT: 'patrol_enabled',
  SPATIAL_FEATURES: 'spatial_features_enabled',
  SUBJECTS: 'subjects_enabled',
  TABLEAU: 'tableau_enabled',
  GEO_SPAN: 'geo_span',
};


export const IF_IS_GENERIC = (ifGeneric, ifNonGeneric) => ['case',
  ['in', 'generic', ['get', 'image']], ifGeneric,
  ifNonGeneric,
];

export const SYMBOL_ICON_SIZE_EXPRESSION = [
  'interpolate', ['exponential', 0.5], ['zoom'],
  0, IF_IS_GENERIC(0.1 / MAP_ICON_SCALE, 0.2 / MAP_ICON_SCALE),
  14, IF_IS_GENERIC(0.5 / MAP_ICON_SCALE, 1 / MAP_ICON_SCALE),
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
    label: 'Review',
    value: ['review'],
    key: 'review'
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
  REVIEW: 'review',
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

export const GEOLOCATOR_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
};

export const DEFAULT_TOAST_CONFIG = {
  closeOnClick: false,
  position: 'top-right',
  type: 'error',
};

export const MAPBOX_STYLE_LAYER_SOURCE_TYPES = ['mapbox_style'];
export const GOOGLE_LAYER_SOURCE_TYPES = ['google_map'];
export const TILE_LAYER_SOURCE_TYPES = ['tile_server', 'mapbox_tiles', 'wms_basemap'];
export const VALID_LAYER_SOURCE_TYPES = [...MAPBOX_STYLE_LAYER_SOURCE_TYPES, /* ...GOOGLE_LAYER_SOURCE_TYPES, */ ...TILE_LAYER_SOURCE_TYPES];

export const DEFAULT_SHOW_TRACK_DAYS = 7;

export const EXTERNAL_SAME_DOMAIN_ROUTES = [
  '/admin',
  '/admin/',
];

export const PERMISSION_KEYS = {
  PATROLS: 'patrol',
  PATROL_TYPES: 'patroltype',
  MESSAGES: 'message',
  OBSERVATIONS: 'observation',
  EVENTS: 'event',
};

export const PERMISSIONS = {
  CREATE: 'add',
  READ: 'view',
  UPDATE: 'change',
  DELETE: 'delete',
  EXPORT: 'export',
};

export const SUBJECT_FEATURE_CONTENT_TYPE = 'observations.subject';

export const GEAR_FEATURE_CONTENT_TYPE = 'buoy.gear';

export const ASCENDING_SORT_ORDER = 'asc';
export const DESCENDING_SORT_ORDER = 'desc';

export const VALID_EVENT_GEOMETRY_TYPES = {
  POLYGON: 'Polygon',
  POINT: 'Point',
};

export const SUPPORTED_LANGUAGES = {
  'en-US': 'English (United States)',
  es: 'Español',
  fr: 'Français',
  'ne-NP': 'नेपाली',
  pt: 'Português',
  sw: 'Swahili',
};

export const FEATURE_FLAG_LABELS = {};

export const DEVELOPMENT_FEATURE_FLAGS = {};

export const LINK_TYPES = { PATROL: 'patrol', EVENT: 'event' };

export const EVENT_SORT_OPTIONS = [
  { value: 'updated_at', key: 'updatedAtLabel' },
  { value: 'created_at', key: 'createdAtLabel' },
  { value: 'event_time', key: 'eventTimeLabel' },
];

export const MAP_LAYER_SORT_VALUES = {
  ALPHABETICAL: 'alphabetical',
  LAST_UPDATE: 'last_update',
};

export const MAP_LAYER_SORT_OPTIONS = [
  { value: 'last_update', key: 'lastUpdate' },
  { value: 'alphabetical', key: 'alphabetical' },
];

export const SORT_DIRECTION = { up: 'up', down: 'down' };

export const DEFAULT_EVENT_SORT = [SORT_DIRECTION.down, EVENT_SORT_OPTIONS[0]];

export const BOOTSTRAP_DEFAULTS = {
  COLLAPSE_TRANSITION_TIME: 300,
  MODAL_ZINDEX: 1055,
};

export const TIME_OF_DAY_PERIODS = [
  {
    rangeString: '12:01 - 15:00',
    rangeMinutesMin: 721,
    rangeMinutesMax: 900,
    color: '#f3e34b'
  },
  {
    rangeString: '15:01 - 18:00',
    rangeMinutesMin: 901,
    rangeMinutesMax: 1080,
    color: '#ffbd00'
  },
  {
    rangeString: '18:01 - 21:00',
    rangeMinutesMin: 1081,
    rangeMinutesMax: 1260,
    color: '#de5285'
  },
  {
    rangeString: '21:01 - 00:00',
    rangeMinutesMin: 1261,
    rangeMinutesMax: 1440,
    color: '#8d4e85'
  },
  {
    rangeString: '00:01 - 03:00',
    rangeMinutesMin: 1,
    rangeMinutesMax: 180,
    color: '#5b5ee9'
  },
  {
    rangeString: '03:01 - 06:00',
    rangeMinutesMin: 181,
    rangeMinutesMax: 360,
    color: '#1a5fb4'
  },
  {
    rangeString: '06:01 - 09:00',
    rangeMinutesMin: 361,
    rangeMinutesMax: 54,
    color: '#29a272'
  },
  {
    rangeString: '09:01 - 12:00',
    rangeMinutesMin: 55,
    rangeMinutesMax: 720,
    color: '#2ec27e'
  }
];

export const TRACKING_CONTROL_STATES = {
  FULLY_HEATMAPPED: 'FULLY_HEATMAPPED',
  PARTIALLY_HEATMAPPED: 'PARTIALLY_HEATMAPPED',
  FULLY_PINNED: 'FULLY_PINNED',
  PARTIALLY_PINNED: 'PARTIALLY_PINNED',
  FULLY_VISIBLE: 'FULLY_VISIBLE',
  PARTIALLY_VISIBLE: 'PARTIALLY_VISIBLE',
};