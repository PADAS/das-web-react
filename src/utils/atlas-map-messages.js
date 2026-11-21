export const ATLAS_MAP_ACTIONS = {
  FIT_BOUNDS: 'fit-bounds',
  JUMP_TO: 'jump-to',
  OPEN_RECORD: 'open-record',
};

export const ATLAS_MAP_RECORD_TYPES = { EVENT: 'event', PATROL: 'patrol' };

export const MAX_ZOOM = 22;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const isNumberInRange = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;

const isLongitude = (value) => isNumberInRange(value, -180, 180);

const isLatitude = (value) => isNumberInRange(value, -90, 90);

const isPosition = (value) => Array.isArray(value) && value.length === 2 && isLongitude(value[0]) && isLatitude(value[1]);

const parseJumpTo = ({ coordinates, zoom }) => {
  if (!isPosition(coordinates)) return null;
  if (zoom !== undefined && !isNumberInRange(zoom, 0, MAX_ZOOM)) return null;

  return { coordinates: [coordinates[0], coordinates[1]], ...(zoom !== undefined && { zoom }) };
};

const parseFitBounds = ({ bbox }) => {
  if (!Array.isArray(bbox) || bbox.length !== 4) return null;

  const [west, south, east, north] = bbox;
  if (!isLongitude(west) || !isLongitude(east) || !isLatitude(south) || !isLatitude(north)) return null;
  if (west > east || south > north) return null;

  return { bbox: [west, south, east, north] };
};

const parseOpenRecord = ({ er_type: erType, id }) => {
  if (!Object.values(ATLAS_MAP_RECORD_TYPES).includes(erType)) return null;
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) return null;

  return { er_type: erType, id };
};

const PARSERS_BY_ACTION = {
  [ATLAS_MAP_ACTIONS.FIT_BOUNDS]: parseFitBounds,
  [ATLAS_MAP_ACTIONS.JUMP_TO]: parseJumpTo,
  [ATLAS_MAP_ACTIONS.OPEN_RECORD]: parseOpenRecord,
};

// Returns the validated action and its params, or null when the message is
// malformed. The caller checks the message type and its origin.
export const parseAtlasMapMessage = (data) => {
  if (!isPlainObject(data) || !Object.hasOwn(PARSERS_BY_ACTION, data.action)) return null;

  const params = PARSERS_BY_ACTION[data.action](data);

  return params ? { action: data.action, ...params } : null;
};

// A bbox without area would make fitBounds zoom all the way in, so it becomes
// a single point that jumpToLocation centers on instead.
export const calcJumpCoordinatesForBbox = ([west, south, east, north]) => (west === east && south === north
  ? [west, south]
  : [[west, south], [east, north]]);
