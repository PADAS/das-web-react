import Ajv from 'ajv';

import toolsDocument from './tools.json';

const TIME_PARAMS = ['since', 'until', 'time'];

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

const isTupleParam = (tool, key) => Array.isArray(tool.inputSchema.properties?.[key]?.items);

const invalid = (name, reason) => ({ message: `Invalid arguments for ${name}: ${reason}`, ok: false });

// Returns the arguments of a valid call with duplicate list items dropped and
// times in UTC, or why the call is invalid.
export const validateToolCall = (name, args = {}) => {
  if (typeof name !== 'string' || !toolsByName.has(name)) return { message: `Unknown tool: ${String(name)}`, ok: false };

  const { tool, validate } = toolsByName.get(name);
  if (!validate(args)) return invalid(name, formatSchemaError(validate.errors[0]));

  const params = {};
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined) continue;

    if (TIME_PARAMS.includes(key) && typeof value === 'string') {
      const time = Date.parse(value);
      if (!Number.isFinite(time)) return invalid(name, `${key} is not a valid time`);

      params[key] = new Date(time).toISOString();
    } else if (Array.isArray(value)) {
      params[key] = isTupleParam(tool, key) ? [...value] : [...new Set(value)];
    } else if (typeof value === 'object' && value !== null) {
      params[key] = { ...value };
    } else {
      params[key] = value;
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
