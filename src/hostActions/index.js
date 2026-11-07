import addFormats from 'ajv-formats';
import Ajv from 'ajv';

import describeEventTypeTool from './describeEventTypeTool';
import draftNewEventTool from './draftNewEventTool';
import HostToolError, { HOST_TOOL_ERROR_CODES } from './HostToolError';
import pinSubjectTracksTool from './pinSubjectTracksTool';
import setDateRangeTool from './setDateRangeTool';
import setEventFilterTool from './setEventFilterTool';
import setMapLayerVisibilityTool from './setMapLayerVisibilityTool';
import setPatrolFilterTool from './setPatrolFilterTool';
import showEventTool from './showEventTool';
import showPatrolTool from './showPatrolTool';

// No tool writes to the site. A draft tool fills a form that the person saves.
const HOST_TOOLS = [
  describeEventTypeTool,
  draftNewEventTool,
  pinSubjectTracksTool,
  setDateRangeTool,
  setEventFilterTool,
  setMapLayerVisibilityTool,
  setPatrolFilterTool,
  showEventTool,
  showPatrolTool,
];

export const HOST_TOOLS_VERSION = 1;

export const HOST_TOOL_SPECS = HOST_TOOLS.map((hostTool) => ({
  description: hostTool.description,
  inputSchema: hostTool.inputSchema,
  name: hostTool.name,
}));

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
// Hints for pickers and for Atlas. They do not change what is valid:
// "x-source" names the site data a value comes from, and "x-within" names the
// sibling property whose picks narrow that data.
ajv.addKeyword({ keyword: 'x-source', schemaType: 'string' });
ajv.addKeyword({ keyword: 'x-within', schemaType: 'string' });

const HOST_TOOLS_BY_NAME = Object.fromEntries(HOST_TOOLS.map((hostTool) => [
  hostTool.name,
  { run: hostTool.run, validate: ajv.compile(hostTool.inputSchema) },
]));

const runHostTool = async (name, args, context) => {
  if (!Object.hasOwn(HOST_TOOLS_BY_NAME, name)) {
    throw new HostToolError(HOST_TOOL_ERROR_CODES.UNKNOWN_TOOL, `No tool named ${name}.`);
  }

  const hostTool = HOST_TOOLS_BY_NAME[name];
  if (!hostTool.validate(args)) {
    throw new HostToolError(HOST_TOOL_ERROR_CODES.INVALID_ARGUMENTS, ajv.errorsText(hostTool.validate.errors));
  }

  return hostTool.run(args, context);
};

export default runHostTool;
