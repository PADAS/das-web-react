import { DATE_TIME_ELEMENT_INPUT_TYPES, FORM_ELEMENT_TYPES } from '../../../constants';

const DATE_JSON_SCHEMA_FORMAT_TO_INPUT_TYPE = {
  'date-time': DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
  date: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
  time: DATE_TIME_ELEMENT_INPUT_TYPES.TIME,
};

const transformDateTimeField = (
  dateTimeFieldId,
  jsonSchema,
  uiSchema,
  formElements,
) => {
  const dateTimeFieldJSONSchema = jsonSchema.properties[dateTimeFieldId];
  const dateTimeFieldUISchema = uiSchema.fields[dateTimeFieldId];

  // Add the date-time field node to the form elements object.
  formElements[dateTimeFieldId] = {
    details: {
      conditionalDependents: dateTimeFieldUISchema.conditionalDependents ?? [],
      description: dateTimeFieldJSONSchema.description ?? '',
      inputType:
        DATE_JSON_SCHEMA_FORMAT_TO_INPUT_TYPE[dateTimeFieldJSONSchema.format] ??
        DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
      isActive: !dateTimeFieldJSONSchema.deprecated,
      isRequired: jsonSchema.required.some(
        (requiredField) => requiredField === dateTimeFieldId,
      ),
      label: dateTimeFieldJSONSchema.title ?? '',
      value: dateTimeFieldId,
    },
    id: dateTimeFieldId,
    isNew: false,
    isSpacer: false,
    parentId: dateTimeFieldUISchema.parent,
    type: FORM_ELEMENT_TYPES.DATE_TIME,
  };
};

export default transformDateTimeField;
