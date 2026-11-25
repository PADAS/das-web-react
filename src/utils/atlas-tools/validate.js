import Ajv from 'ajv';

import toolsDocument from './tools.json';

const TIME_PARAMS = ['since', 'until', 'time'];

const LONGITUDE = { max: 180, name: 'a longitude' };
const LATITUDE = { max: 90, name: 'a latitude' };
// What each position of a coordinate list holds, which the schema leaves out
// so that it reads the same in every JSON Schema dialect.
const POSITION_RANGES = {
  bbox: [LONGITUDE, LATITUDE, LONGITUDE, LATITUDE],
  coordinates: [LONGITUDE, LATITUDE],
  lnglat: [LONGITUDE, LATITUDE],
};

// The pattern tools.json gives every id.
const UUID_SCHEMA_PATTERN = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
const WRITTEN_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:[Zz]|([+-])(\d{2}):?(\d{2}))$/;

export const ATLAS_TOOLS_VERSION = toolsDocument.version;

export const ATLAS_TOOLS = toolsDocument.tools.map(({ annotations, description, inputSchema, name }) => ({
  annotations,
  description,
  inputSchema,
  name,
}));

export const ATLAS_TOOL_NAMES = ATLAS_TOOLS.map(({ name }) => name);

// unicode: false counts maxLength in UTF-16 units, like a string's length. Ajv
// logs that the option is deprecated, so its logger is off, and the strict
// checks it would only have logged throw instead.
const ajv = new Ajv({ allErrors: false, logger: false, strictTuples: true, strictTypes: true, unicode: false });

const toolsByName = new Map(ATLAS_TOOLS.map((tool) => [tool.name, { tool, validate: ajv.compile(tool.inputSchema) }]));

const formatSchemaError = ({ instancePath, keyword, message, params }) => {
  const path = instancePath ? instancePath.slice(1).replaceAll('/', '.') : 'arguments';
  const detail = keyword === 'additionalProperties' ? ` (${params.additionalProperty})` : '';

  return `${path} ${message}${detail}`;
};

const isUuidParam = (tool, key) => {
  const schema = tool.inputSchema.properties?.[key];

  return schema?.pattern === UUID_SCHEMA_PATTERN || schema?.items?.pattern === UUID_SCHEMA_PATTERN;
};

// Handlers look ids up case-sensitively, and the API writes them in lower case.
const normalizeUuid = (value) => value.toLowerCase();

// Whether the time names the instant it was parsed to: Date.parse rolls
// 2026-02-30 over to March, and 24:00 over to the next day.
const isRealInstant = (value, time) => {
  const [, year, month, day, hour, minute, second = '00', sign, offsetHours = '00', offsetMinutes = '00'] = value
    .match(WRITTEN_TIME_PATTERN) ?? [];
  if (!year || Number(offsetHours) > 23 || Number(offsetMinutes) > 59) return false;

  const offsetMs = (sign === '-' ? -1 : 1) * (Number(offsetHours) * 60 + Number(offsetMinutes)) * 60_000;
  const local = new Date(time + offsetMs);

  return local.getUTCFullYear() === Number(year)
    && local.getUTCMonth() + 1 === Number(month)
    && local.getUTCDate() === Number(day)
    && local.getUTCHours() === Number(hour)
    && local.getUTCMinutes() === Number(minute)
    && local.getUTCSeconds() === Number(second);
};

const findPositionError = (key, values) => {
  const index = values.findIndex((value, position) => !(Math.abs(value) <= POSITION_RANGES[key][position].max));

  if (index === -1) return null;

  const { max, name } = POSITION_RANGES[key][index];

  return `${key}[${index}] must be ${name} in -${max}..${max}`;
};

const invalid = (name, reason) => ({ message: `Invalid arguments for ${name}: ${reason}`, ok: false });

// Returns the arguments of a valid call with ids in lower case, duplicate list
// items dropped and times in UTC, or why the call is invalid.
export const validateToolCall = (name, args = {}) => {
  if (typeof name !== 'string' || !toolsByName.has(name)) return { message: `Unknown tool: ${String(name)}`, ok: false };

  const { tool, validate } = toolsByName.get(name);
  if (!validate(args)) return invalid(name, formatSchemaError(validate.errors[0]));

  const params = {};
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined) continue;

    if (TIME_PARAMS.includes(key) && typeof value === 'string') {
      const time = Date.parse(value);
      if (!Number.isFinite(time) || !isRealInstant(value, time)) return invalid(name, `${key} is not a valid time`);

      params[key] = new Date(time).toISOString();
    } else if (Object.hasOwn(POSITION_RANGES, key)) {
      const positionError = findPositionError(key, value);
      if (positionError) return invalid(name, positionError);

      params[key] = [...value];
    } else if (Array.isArray(value)) {
      params[key] = [...new Set(isUuidParam(tool, key) ? value.map(normalizeUuid) : value)];
    } else if (typeof value === 'object' && value !== null) {
      params[key] = { ...value };
    } else {
      params[key] = isUuidParam(tool, key) ? normalizeUuid(value) : value;
    }
  }

  if (params.since && params.until && Date.parse(params.since) > Date.parse(params.until)) {
    return invalid(name, 'since is after until');
  }

  if (params.bbox) {
    const [west, south, east, north] = params.bbox;
    if (west > east || south > north) return invalid(name, 'bbox needs west <= east and south <= north');
  }

  return { ok: true, params };
};
