import { uuid } from '../../utils/string';

import { ajv as schemaFormAjv } from '../../SchemaForm/utils/useSchemaValidations';
import HostToolError, { HOST_TOOL_ERROR_CODES } from '../HostToolError';
import { loadV2EventType } from '../describeEventTypeTool';
import { selectCreatableEventTypesByCategory } from '../../selectors/event-types';
import { TAB_KEYS } from '../../constants';

export const DRAFTED_BY_ATLAS = 'atlas';

// Checks the values with the form's own validator. A missing required field is
// fine: the person fills it in before saving.
const findInvalidFields = (schema, eventDetails) => {
  const validate = schemaFormAjv.compile(schema.json);
  if (validate(eventDetails)) return [];

  return validate.errors
    .filter(({ keyword }) => keyword !== 'if' && keyword !== 'required')
    .map((error) => ({
      field: error.params?.additionalProperty ?? error.instancePath.slice(1).replaceAll('/', '.'),
      message: error.message,
    }));
};

const draftNewEventTool = {
  description: 'Open the new-event form for a v2 event type with the given values filled in, for the person to '
    + 'check and save. It saves nothing: each filled field shows "Filled by Atlas" until the person keeps or changes '
    + 'it, and saving records on the event that Atlas drafted it. Read the fields with describe_event_type first.',
  inputSchema: {
    additionalProperties: false,
    properties: {
      event_details: {
        description: 'Form field values by field name, as describe_event_type lists them.',
        type: 'object',
        'x-source': 'event_type_fields',
        'x-within': 'event_type_id',
      },
      event_type_id: {
        description: 'The event type id, a UUID. v2 types only.',
        format: 'uuid',
        type: 'string',
        'x-source': 'v2_event_types',
      },
      location: {
        additionalProperties: false,
        description: 'Where it happened. Ignored for event types whose geometry is not a point.',
        properties: {
          latitude: { maximum: 90, minimum: -90, type: 'number' },
          longitude: { maximum: 180, minimum: -180, type: 'number' },
        },
        required: ['latitude', 'longitude'],
        type: 'object',
      },
      reported_by_id: { description: 'The id of the subject or user who reported it.', type: 'string' },
      time: { description: 'When it happened, ISO 8601. Defaults to now.', format: 'date-time', type: 'string' },
    },
    required: ['event_type_id'],
    type: 'object',
  },
  name: 'draft_new_event',
  run: async (args, context) => {
    const { eventType, schema } = await loadV2EventType(args.event_type_id, context);

    const isCreatable = selectCreatableEventTypesByCategory(context.getState())
      .some((category) => category.types.some((creatableType) => creatableType.id === eventType.id));
    if (!isCreatable) {
      throw new HostToolError(
        HOST_TOOL_ERROR_CODES.INVALID_ARGUMENTS,
        `The user cannot create events of type ${eventType.value}.`
      );
    }

    const eventDetails = args.event_details ?? {};
    const invalidFields = findInvalidFields(schema, eventDetails);
    if (invalidFields.length) {
      throw new HostToolError(
        HOST_TOOL_ERROR_CODES.INVALID_ARGUMENTS,
        invalidFields.map(({ field, message }) => `${field}: ${message}`).join('; ')
      );
    }

    const reportData = { draftedBy: DRAFTED_BY_ATLAS, eventDetails };
    if (args.location && eventType.geometry_type === 'Point') reportData.location = args.location;
    if (args.reported_by_id) reportData.reportedById = args.reported_by_id;
    if (args.time) reportData.time = args.time;

    context.navigate(
      { pathname: `/${TAB_KEYS.EVENTS}/new`, search: `?reportType=${eventType.id}` },
      { state: { reportData, temporalId: uuid() } }
    );

    return {
      event_type_value: eventType.value,
      filled_fields: Object.keys(eventDetails),
      location_used: !!reportData.location,
      saved: false,
    };
  },
};

export default draftNewEventTool;
