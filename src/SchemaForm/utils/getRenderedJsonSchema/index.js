import { omit } from 'lodash-es';

import { FORM_ELEMENT_TYPES } from '../../../utils/form-schemas/constants';

// The ajv instance caches a validator for each schema object it compiles, so the same derived schema object must be
// returned for the same JSON schema.
const renderedJsonSchemas = new WeakMap();

const getFieldId = (fieldName, parentCollectionId) => parentCollectionId ? `${parentCollectionId}.${fieldName}` : fieldName;

const getRenderedObjectSchema = (objectSchema, formElements, parentCollectionId = null) => {
  const properties = {};

  Object.keys(objectSchema.properties ?? {}).forEach((fieldName) => {
    const fieldId = getFieldId(fieldName, parentCollectionId);
    const fieldSchema = objectSchema.properties[fieldName];

    if (!formElements[fieldId]) {
      // The form does not render this field, so any value is valid.
      properties[fieldName] = true;
    } else if (formElements[fieldId].type === FORM_ELEMENT_TYPES.COLLECTION) {
      properties[fieldName] = { ...fieldSchema, items: getRenderedObjectSchema(fieldSchema.items, formElements, fieldId) };
    } else {
      properties[fieldName] = fieldSchema;
    }
  });

  return {
    // Without it, the stored values the form does not render are not errors.
    ...omit(objectSchema, 'unevaluatedProperties'),
    properties,
    required: (objectSchema.required ?? [])
      .filter((fieldName) => !!formElements[getFieldId(fieldName, parentCollectionId)]),
  };
};

const getRenderedJsonSchema = (jsonSchema, formElements) => {
  if (!renderedJsonSchemas.has(jsonSchema)) {
    const renderedJsonSchema = getRenderedObjectSchema(jsonSchema, formElements);

    if (jsonSchema.allOf) {
      // The "if" subschemas are left as they are, so the section conditions read the real form data.
      renderedJsonSchema.allOf = jsonSchema.allOf.map((conditionalSectionSubschema) => conditionalSectionSubschema.then
        ? { ...conditionalSectionSubschema, then: getRenderedObjectSchema(conditionalSectionSubschema.then, formElements) }
        : conditionalSectionSubschema);
    }

    renderedJsonSchemas.set(jsonSchema, renderedJsonSchema);
  }

  return renderedJsonSchemas.get(jsonSchema);
};

export default getRenderedJsonSchema;
