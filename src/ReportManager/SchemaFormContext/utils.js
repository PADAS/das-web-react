
export const isSchemaFieldRequired = (schema, fieldName) => schema.json.required.includes(fieldName);

export const getSchemaFieldUIType = (schema, fieldName) => schema.ui.fields[fieldName].type;

export const isFieldActive = (schema, fieldName) => {
  return !schema.json.properties[fieldName].deprecated;
};