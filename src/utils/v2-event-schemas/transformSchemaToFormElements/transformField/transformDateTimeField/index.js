import { DATE_TIME_ELEMENT_INPUT_TYPES } from '../../../constants';

const DATE_JSON_SCHEMA_FORMAT_TO_INPUT_TYPE = {
  'date-time': DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
  date: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
  time: DATE_TIME_ELEMENT_INPUT_TYPES.TIME,
};

const transformDateTimeField = (
  dateTimeFieldId,
  jsonSchema,
  _uiSchema,
  formElements,
) => {
  const dateTimeFieldJSONSchema = jsonSchema.properties[dateTimeFieldId];

  // Add the date-time field specific properties to its node in the form
  // elements object.
  formElements[dateTimeFieldId].details = {
    ...formElements[dateTimeFieldId].details,
    description: dateTimeFieldJSONSchema.description ?? '',
    inputType:
      DATE_JSON_SCHEMA_FORMAT_TO_INPUT_TYPE[dateTimeFieldJSONSchema.format] ??
      DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
  };
};

export default transformDateTimeField;
