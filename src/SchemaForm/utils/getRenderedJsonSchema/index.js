import omit from 'lodash/omit';

import { FORM_ELEMENT_TYPES } from '../../../utils/form-schemas/constants';

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

// Ajv keeps a validator per schema object, so the derived one is reused.
const RENDERED_JSON_SCHEMAS = new WeakMap();

const getFieldId = (fieldName, parentCollectionId) =>
  parentCollectionId ? `${parentCollectionId}.${fieldName}` : fieldName;

const getRenderedObjectSchema = (objectSchema, formElements, parentCollectionId = null) => {
  const properties = {};

  Object.keys(objectSchema.properties ?? EMPTY_OBJECT).forEach((fieldName) => {
    const fieldId = getFieldId(fieldName, parentCollectionId);

    if (formElements[fieldId]?.type === FORM_ELEMENT_TYPES.COLLECTION) {
      properties[fieldName] = {
        ...objectSchema.properties[fieldName],
        items: getRenderedObjectSchema(objectSchema.properties[fieldName].items, formElements, fieldId),
      };
    } else if (formElements[fieldId]) {
      properties[fieldName] = objectSchema.properties[fieldName];
    } else {
      // The form does not render this field, so any value is valid.
      properties[fieldName] = true;
    }
  });

  return {
    // Stored values the form does not render must not be errors.
    ...omit(objectSchema, 'unevaluatedProperties'),
    properties,
    required: (objectSchema.required ?? EMPTY_ARRAY)
      .filter((fieldName) => formElements[getFieldId(fieldName, parentCollectionId)]),
  };
};

const getRenderedJsonSchema = (jsonSchema, formElements) => {
  if (!RENDERED_JSON_SCHEMAS.has(jsonSchema)) {
    const renderedJsonSchema = getRenderedObjectSchema(jsonSchema, formElements);

    if (jsonSchema.allOf) {
      // The if subschemas stay as they are to read the real form data.
      renderedJsonSchema.allOf = jsonSchema.allOf.map((subschema) => subschema.then
        ? { ...subschema, then: getRenderedObjectSchema(subschema.then, formElements) }
        : subschema);
    }

    RENDERED_JSON_SCHEMAS.set(jsonSchema, renderedJsonSchema);
  }

  return RENDERED_JSON_SCHEMAS.get(jsonSchema);
};

export default getRenderedJsonSchema;
