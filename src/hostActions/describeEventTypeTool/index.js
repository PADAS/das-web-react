import { fetchEventTypeSchema } from '../../ducks/event-schemas';
import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from '../../utils/form-schemas/constants';
import HostToolError, { HOST_TOOL_ERROR_CODES } from '../HostToolError';
import { selectEventSchema } from '../../selectors/event-schemas';
import { selectEventTypeById } from '../../selectors/event-types';
import transformSchemaToFormElements from '../../utils/form-schemas/transformSchemaToFormElements';

// Atlas drafts only v2 event types: v1 is being retired.
export const loadV2EventType = async (eventTypeId, context) => {
  const eventType = selectEventTypeById(context.getState(), eventTypeId);
  if (!eventType) {
    throw new HostToolError(HOST_TOOL_ERROR_CODES.NOT_FOUND, `No event type with id ${eventTypeId}.`);
  }
  if (eventType.version !== 2) {
    throw new HostToolError(
      HOST_TOOL_ERROR_CODES.INVALID_ARGUMENTS,
      `Event type ${eventType.value} uses the v1 form. Atlas can only describe and draft v2 event types.`
    );
  }

  if (!selectEventSchema(context.getState(), eventType.value)) {
    await context.dispatch(fetchEventTypeSchema(eventType.value));
  }

  const schema = selectEventSchema(context.getState(), eventType.value);
  if (!schema?.json || schema.error) {
    throw new HostToolError(HOST_TOOL_ERROR_CODES.FAILED, `The form for event type ${eventType.value} did not load.`);
  }

  return { eventType, formElements: transformSchemaToFormElements(schema), schema };
};

const describeField = (fieldId, formElements) => {
  const { details, type } = formElements[fieldId];
  const field = { label: details.label, name: details.value, required: details.isRequired, type };

  if (details.description) field.description = details.description;
  if (type === FORM_ELEMENT_TYPES.CHOICE_LIST) {
    field.multiple = details.multiple;
    field.options = details.options.map((option) => ({ label: option.display, value: option.value }));
  }
  if (type === FORM_ELEMENT_TYPES.COLLECTION) {
    field.item_fields = [...details.leftColumn, ...details.rightColumn]
      .filter((childId) => formElements[childId].type !== FORM_ELEMENT_TYPES.HEADER)
      .map((childId) => describeField(childId, formElements));
  }

  return field;
};

const describeEventTypeTool = {
  description: 'List the fields of an event type\'s form, so Atlas knows what draft_new_event can fill. '
    + 'v2 event types only. A field in a conditional section shows only when its conditions hold.',
  inputSchema: {
    additionalProperties: false,
    properties: {
      event_type_id: {
        description: 'The event type id, a UUID. v2 types only.',
        format: 'uuid',
        type: 'string',
        'x-source': 'v2_event_types',
      },
    },
    required: ['event_type_id'],
    type: 'object',
  },
  name: 'describe_event_type',
  run: async (args, context) => {
    const { eventType, formElements } = await loadV2EventType(args.event_type_id, context);
    const sectionIds = formElements[ROOT_CANVAS_ID].details.sections;

    return {
      event_type_id: eventType.id,
      event_type_value: eventType.value,
      geometry_type: eventType.geometry_type,
      sections: sectionIds.map((sectionId) => ({
        conditional: formElements[sectionId].details.conditions.length > 0,
        fields: [...formElements[sectionId].details.leftColumn, ...formElements[sectionId].details.rightColumn]
          .filter((childId) => formElements[childId].type !== FORM_ELEMENT_TYPES.HEADER)
          .map((childId) => describeField(childId, formElements)),
        label: formElements[sectionId].details.label,
      })),
      title: eventType.display,
    };
  },
};

export default describeEventTypeTool;
