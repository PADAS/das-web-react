import AjvLatest from 'ajv-latest/dist/2019'; // including 2019-09 and 2020-12 drafts https://ajv.js.org/guide/schema-language.html#draft-2019-09-and-draft-2020-12
import Ajv6 from 'ajv-6';

const getAjvInstance = (useLatest = true) => useLatest ? new AjvLatest() : new Ajv6();

const ajv = getAjvInstance();

const validateSchema = (schema) => {
  const isValid = ajv.validateSchema(schema);
  return {
    errors: !isValid ? ajv.errors : null,
    isValid
  };
};

const getFieldName = (field) => Object.keys(field)[0];

const generateField = (name, type, fieldProps, isRequired = false) => ({
  [name]: {
    type,
    isRequired,
    ...fieldProps
  }
});

const makeFieldRequired = (schema, field) => {
  const fieldName = getFieldName(field);
  if (schema.required.includes(fieldName)){
    return schema;
  }
  return {
    ...schema,
    required: [
      ...schema.required,
      fieldName
    ]
  };
};

const createNewEmptySchema = (id, title, description = '', generalSchemaProps = {}) => ({
  '$id': id,
  type: 'object',
  properties: {},
  required: [],
  title,
  description,
  ...generalSchemaProps
});

const addFieldToSchema = (schema, field) => {
  const fieldName = getFieldName(field);
  const { isRequired = false, ...fieldProps } = field[fieldName];
  const schemaWithNewField = {
    ...schema,
    properties: {
      ...schema.properties,
      [fieldName]: {
        ...fieldProps
      }
    }
  };

  if (isRequired){
    return makeFieldRequired(schemaWithNewField, field);
  }

  return schemaWithNewField;
};

const addFieldsToSchema = (schema, ...fields) => {
  let schemaWithFields = schema;
  for (const field of fields) {
    schemaWithFields = addFieldToSchema(schemaWithFields, field);
  }

  return schemaWithFields;
};

const prepareSchema = (schema) => ajv.compile(schema);

const SchemaFactory = {
  createNewEmptySchema,
  generateField,
  addFieldsToSchema,
  prepareSchema,
  validateSchema
};

export default SchemaFactory;
