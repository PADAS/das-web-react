export const generateFormSchemasFromEventTypeSchema = ({ definition:definitions, schema }) => {
  if (!definitions) return schema;

  const newSchema = { ...schema };
  const uiSchema = {};

  const generatedSchemaEntries = convertDefinitionsToSchemas(definitions, schema);

  generatedSchemaEntries.forEach(({ schemaEntry, uiSchemaEntry }) => {
    newSchema.properties[schemaEntry.key] = { ...newSchema.properties[schemaEntry.key], ...schemaEntry };
    uiSchema[schemaEntry.key] = uiSchemaEntry;
  });
  return {
    schema: newSchema,
    uiSchema,
  };
};

const convertDefinitionsToSchemas = (definitions, schema) => {
  const definitionsToConvert = definitions.filter(d => (typeof d !== 'string') && !!schema.properties[d.key]);

  return definitionsToConvert.reduce((accumulator, definition) => {
    const { type } = definition;

    if (type === 'checkboxes') {
      return [...accumulator, generateSchemaAndUiSchemaForCheckbox(definition)];
    }
    return accumulator;
  }, []);
};

export const convertSchemaEnumNameObjectsIntoArray = (schema) => {
  const { properties } = schema;
  const updates = Object.entries(properties).reduce((propsObject, [key, value]) => {
    if (value.enumNames && !Array.isArray(value.enumNames)) {
      propsObject[key] = {
        ...value,
        enumNames: value.enum.map(item => value.enumNames[item]),
      };

    } else if (value.properties) {
      propsObject[key] = convertSchemaEnumNameObjectsIntoArray(value);
    }
    return propsObject;
  }, []);

  return {
    ...schema,
    properties: {
      ...properties,
      ...updates,
    },
  };
};

const generateSchemaAndUiSchemaForCheckbox = (definition) => {
  const { key, title, titleMap } = definition;

  return {
    schemaEntry: {
      key,
      items: {
        enum: titleMap.map(item => item.value),
        enumNames: titleMap.map(item => item.name),
      },
      title,
      type: 'array',
      uniqueItems: true,
    },
    uiSchemaEntry: {
      'ui:widget': 'checkboxes',
    },
  };
};

export const unwrapEventDetailSelectValues = (data) => {
  const itemHasNameAndValue = item => item && item.name && item.value;

  const updates = Object.entries(data).reduce((propsObject, [key, val]) => {
    if (itemHasNameAndValue(val)) {
      propsObject[key] = val.value;
    } else if (Array.isArray(val) && itemHasNameAndValue(val[0])) {
      propsObject[key] = val.map(({ value }) => value);
    }
    return propsObject;
  }, {});

  return { ...data, ...updates };
};