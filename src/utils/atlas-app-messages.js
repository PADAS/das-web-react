export const ATLAS_APP_ACTIONS = {
  EVENTS_FILTER: 'events-filter',
  LAYERS_SEARCH: 'layers-search',
  OPEN_EVENT: 'open-event',
  OPEN_PATROL: 'open-patrol',
  PATROLS_FILTER: 'patrols-filter',
  REPORT_HEATMAP: 'report-heatmap',
  SHOW_ANALYZER: 'show-analyzer',
  SHOW_FEATURE: 'show-feature',
  SUBJECT_AT_TIME: 'subject-at-time',
  SUBJECT_HEATMAP: 'subject-heatmap',
  SUBJECT_POPUP: 'subject-popup',
  SUBJECT_TRACK: 'subject-track',
  SUBJECTS_VISIBILITY: 'subjects-visibility',
};

export const EVENT_STATE_OPTIONS = ['active', 'review', 'resolved', 'all'];
export const EVENT_PRIORITY_OPTIONS = [0, 100, 200, 300];
export const EVENT_SORT_FIELD_OPTIONS = ['updated_at', 'created_at', 'event_time'];
export const SORT_DIRECTION_OPTIONS = ['up', 'down'];
export const PATROL_STATUS_OPTIONS = ['active', 'done', 'cancelled'];
export const LAYERS_TAB_OPTIONS = ['subjects', 'features', 'analyzers'];

export const MAX_TEXT_LENGTH = 100;
export const MAX_FILTER_IDS = 500;
export const MAX_TRACK_SUBJECTS = 20;
export const MAX_HEATMAP_SUBJECTS = 200;
export const MAX_VISIBILITY_SUBJECTS = 500;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Times must carry their offset, so a step never depends on the browser's zone.
const ISO_DATE_TIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})$/i;

// Marks a param as invalid, as opposed to absent (undefined).
const INVALID = Symbol('invalid');

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const isUuid = (value) => typeof value === 'string' && UUID_REGEX.test(value);

const parseIsoDate = (value) => {
  if (typeof value !== 'string' || !ISO_DATE_TIME_REGEX.test(value)) return INVALID;

  const time = Date.parse(value);

  return Number.isFinite(time) ? new Date(time).toISOString() : INVALID;
};

const optional = (parse) => (value) => value === undefined ? undefined : parse(value);

const optionalDate = optional(parseIsoDate);

const optionalNullableDate = (value) => value === null ? null : optionalDate(value);

const optionalBoolean = optional((value) => typeof value === 'boolean' ? value : INVALID);

const text = (value) => typeof value === 'string' && value.length <= MAX_TEXT_LENGTH ? value : INVALID;

const oneOf = (options) => (value) => options.includes(value) ? value : INVALID;

const uniqueListOf = (isItem, { maxLength, minLength = 0 }) => (value) => {
  if (!Array.isArray(value) || value.length < minLength || value.length > maxLength) return INVALID;
  if (!value.every(isItem)) return INVALID;

  return [...new Set(value)];
};

const uuidList = (maxLength, minLength = 0) => uniqueListOf(isUuid, { maxLength, minLength });

const id = (value) => isUuid(value) ? value : INVALID;

const sort = (value) => isPlainObject(value)
  && EVENT_SORT_FIELD_OPTIONS.includes(value.field)
  && SORT_DIRECTION_OPTIONS.includes(value.dir)
  ? { dir: value.dir, field: value.field }
  : INVALID;

// Each schema maps a param to its parser. Unknown keys are dropped and
// absent optional params are left out of the result.
const parseWithSchema = (data, schema) => {
  const result = {};

  for (const [key, parse] of Object.entries(schema)) {
    const value = parse(data[key]);
    if (value === INVALID) return null;
    if (value !== undefined) result[key] = value;
  }

  return result;
};

const isWindowOrdered = ({ since, until }) => !since || !until || since <= until;

const withOrderedWindow = (parse) => (data) => {
  const params = parse(data);

  return params && isWindowOrdered(params) ? params : null;
};

const schemaParser = (schema) => (data) => parseWithSchema(data, schema);

const parseSubjectsVisibility = (data) => {
  const modes = ['only', 'hide', 'show'].filter((mode) => data[mode] !== undefined);
  if (modes.length !== 1) return null;

  const ids = uuidList(MAX_VISIBILITY_SUBJECTS, 1)(data[modes[0]]);

  return ids === INVALID ? null : { [modes[0]]: ids };
};

const PARSERS_BY_ACTION = {
  [ATLAS_APP_ACTIONS.EVENTS_FILTER]: withOrderedWindow(schemaParser({
    event_types: optional(uuidList(MAX_FILTER_IDS)),
    open: optionalBoolean,
    priority: optional(uniqueListOf((value) => EVENT_PRIORITY_OPTIONS.includes(value), { maxLength: 4 })),
    reported_by: optional(uuidList(MAX_FILTER_IDS)),
    since: optionalDate,
    sort: optional(sort),
    state: optional(oneOf(EVENT_STATE_OPTIONS)),
    text: optional(text),
    until: optionalNullableDate,
  })),
  [ATLAS_APP_ACTIONS.PATROLS_FILTER]: withOrderedWindow(schemaParser({
    leaders: optional(uuidList(MAX_FILTER_IDS)),
    open: optionalBoolean,
    patrol_types: optional(uuidList(MAX_FILTER_IDS)),
    since: optionalDate,
    status: optional(uniqueListOf((value) => PATROL_STATUS_OPTIONS.includes(value), { maxLength: 3 })),
    text: optional(text),
    until: optionalNullableDate,
  })),
  [ATLAS_APP_ACTIONS.OPEN_EVENT]: schemaParser({ id }),
  [ATLAS_APP_ACTIONS.OPEN_PATROL]: schemaParser({ id }),
  [ATLAS_APP_ACTIONS.SUBJECT_POPUP]: schemaParser({ id, track: optionalBoolean }),
  [ATLAS_APP_ACTIONS.SUBJECT_TRACK]: withOrderedWindow(schemaParser({
    ids: uuidList(MAX_TRACK_SUBJECTS, 1),
    since: optionalDate,
    until: optionalNullableDate,
  })),
  [ATLAS_APP_ACTIONS.SUBJECT_AT_TIME]: schemaParser({ id, time: parseIsoDate }),
  [ATLAS_APP_ACTIONS.SUBJECT_HEATMAP]: withOrderedWindow(schemaParser({
    ids: uuidList(MAX_HEATMAP_SUBJECTS, 1),
    since: optionalDate,
    until: optionalNullableDate,
  })),
  [ATLAS_APP_ACTIONS.REPORT_HEATMAP]: schemaParser({
    on: (value) => typeof value === 'boolean' ? value : INVALID,
  }),
  [ATLAS_APP_ACTIONS.SUBJECTS_VISIBILITY]: parseSubjectsVisibility,
  [ATLAS_APP_ACTIONS.SHOW_FEATURE]: schemaParser({ id }),
  [ATLAS_APP_ACTIONS.SHOW_ANALYZER]: schemaParser({ id }),
  [ATLAS_APP_ACTIONS.LAYERS_SEARCH]: schemaParser({ tab: optional(oneOf(LAYERS_TAB_OPTIONS)), text }),
};

// Returns the validated action and its params, or null when the message is
// malformed. The caller checks the message type and its origin.
export const parseAtlasAppMessage = (data) => {
  if (!isPlainObject(data) || !Object.hasOwn(PARSERS_BY_ACTION, data.action)) return null;

  const params = PARSERS_BY_ACTION[data.action](data);

  return params ? { action: data.action, ...params } : null;
};
