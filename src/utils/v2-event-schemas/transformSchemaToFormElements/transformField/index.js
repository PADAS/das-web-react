import { FORM_ELEMENT_TYPES } from '../../constants';
import InvalidFormElementTypeError from '../InvalidFormElementTypeError';
import transformAttachmentField from './transformAttachmentField';
import transformChoiceListField from './transformChoiceListField';
import transformCollectionField from './transformCollectionField';
import transformDateTimeField from './transformDateTimeField';
import transformLocationField from './transformLocationField';
import transformNumericField from './transformNumericField';
import transformTextField from './transformTextField';

const transformField = (fieldId, jsonSchema, uiSchema, formElements) => {
  const fieldJSONSchema = jsonSchema.properties[fieldId];
  const fieldUISchema = uiSchema.fields[fieldId];

  // Add the field node to the form elements object with the common properties.
  formElements[fieldId] = {
    details: {
      isRequired: jsonSchema.required.some(
        (requiredField) => requiredField === fieldId,
      ),
      label: fieldJSONSchema.title ?? '',
      value: fieldId,
    },
    parentId: fieldUISchema.parent,
    type: fieldUISchema.type,
  };

  // Add the specific properties for each field type.
  switch (fieldUISchema.type) {
  case FORM_ELEMENT_TYPES.ATTACHMENT:
    transformAttachmentField(fieldId, jsonSchema, uiSchema, formElements);
    break;

  case FORM_ELEMENT_TYPES.CHOICE_LIST:
    transformChoiceListField(fieldId, jsonSchema, uiSchema, formElements);
    break;

  case FORM_ELEMENT_TYPES.COLLECTION:
    transformCollectionField(fieldId, jsonSchema, uiSchema, formElements, transformField);
    break;

  case FORM_ELEMENT_TYPES.DATE_TIME:
    transformDateTimeField(fieldId, jsonSchema, uiSchema, formElements);
    break;

  case FORM_ELEMENT_TYPES.LOCATION:
    transformLocationField(fieldId, jsonSchema, uiSchema, formElements);
    break;

  case FORM_ELEMENT_TYPES.NUMERIC:
    transformNumericField(fieldId, jsonSchema, uiSchema, formElements);
    break;

  case FORM_ELEMENT_TYPES.TEXT:
    transformTextField(fieldId, jsonSchema, uiSchema, formElements);
    break;

  default:
    throw new InvalidFormElementTypeError(fieldId, fieldUISchema.type);
  }
};

export default transformField;
