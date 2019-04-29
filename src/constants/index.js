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

export const MAP_ICON_SIZE = {
  height: 30,
  width: 30,
};

// keep this in sync with `/common/styles/_layout.scss`
const mdLayoutWidthMin = '(min-width: 31.75rem)';
const lgLayoutWidthMin = '(min-width: 48rem)';
const mdLayoutWidthMax = `(max-width: calc(${lgLayoutWidthMin} - 1px))`;

export const BREAKPOINTS = {
  screenIsMediumLayoutOrLarger: matchMedia(mdLayoutWidthMin),
  screenIsSmallerThanLargeLayout: matchMedia(mdLayoutWidthMax),
  screenIsLargeayoutOrLarger: matchMedia(lgLayoutWidthMin),
};