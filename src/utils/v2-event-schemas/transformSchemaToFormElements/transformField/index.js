import { FORM_ELEMENT_TYPES } from '../../constants';
import InvalidFormElementTypeError from '../InvalidFormElementTypeError';
import transformAttachmentField from './transformAttachmentField';
import transformBooleanField from './transformBooleanField';
import transformChoiceListField from './transformChoiceListField';
import transformCollectionField from './transformCollectionField';
import transformDateTimeField from './transformDateTimeField';
import transformLocationField from './transformLocationField';
import transformNumericField from './transformNumericField';
import transformTextField from './transformTextField';

const transformField = (
  fieldName,
  parentCollectionFieldId,
  jsonSchema,
  uiSchema,
  formElements,
) => {
  const fieldId = parentCollectionFieldId
    ? `${parentCollectionFieldId}.${fieldName}`
    : fieldName;
  const fieldJSONSchema = jsonSchema.properties[fieldName];
  // Backwards compatibility: uiSchema.fields keys used to be the field names.
  const fieldUISchema = uiSchema.fields[fieldId] ?? uiSchema.fields[fieldName];

  // Add the field form element common properties.
  formElements[fieldId] = {
    details: {
      isRequired: jsonSchema.required.some(
        (requiredFieldName) => requiredFieldName === fieldName,
      ),
      label: fieldJSONSchema.title ?? '',
      value: fieldName,
    },
    id: fieldId,
    parentId: parentCollectionFieldId ?? fieldUISchema.parent,
    type: fieldUISchema.type,
  };

  // Add the field form element type-specific properties.
  switch (fieldUISchema.type) {
  case FORM_ELEMENT_TYPES.ATTACHMENT:
    transformAttachmentField(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );
    break;

  case FORM_ELEMENT_TYPES.BOOLEAN:
    transformBooleanField(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );
    break;

  case FORM_ELEMENT_TYPES.CHOICE_LIST:
    transformChoiceListField(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );
    break;

  case FORM_ELEMENT_TYPES.COLLECTION:
    transformCollectionField(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
      transformField,
    );
    break;

  case FORM_ELEMENT_TYPES.DATE_TIME:
    transformDateTimeField(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );
    break;

  case FORM_ELEMENT_TYPES.LOCATION:
    transformLocationField(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );
    break;

  case FORM_ELEMENT_TYPES.NUMERIC:
    transformNumericField(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );
    break;

  case FORM_ELEMENT_TYPES.TEXT:
    transformTextField(
      fieldId,
      fieldName,
      jsonSchema,
      uiSchema,
      formElements,
    );
    break;

  default:
    throw new InvalidFormElementTypeError(fieldId, fieldUISchema.type);
  }
};

export default transformField;
