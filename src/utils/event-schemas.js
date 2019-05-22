export const addDefinitionsToSchema = (definitions, schema) => {
  if (!definitions) return schema;

  const newSchema = { ...schema };
  const definitionSchemaEntries = convertDefinitionsToSchemas(definitions, schema);

  definitionSchemaEntries.forEach((d) => {
    newSchema.properties[d.key] = { ...newSchema.properties[d.key], ...d };
    delete newSchema.properties[d.key].key;
  });
  return newSchema;
};

const convertDefinitionsToSchemas = (definitions, schema) => {
  const definitionsToConvert = definitions.filter(d => (typeof d !== 'string') && !!schema.properties[d.key]);

  return definitionsToConvert.reduce((accumulator, definition) => {
    const { type } = definition;

    if (type === 'checkboxes') {
      return [...accumulator, convertCheckboxDefinition(definition)];
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

const convertCheckboxDefinition = (definition) => {
  const { key, title, titleMap } = definition;

  return {
    key,
    type: 'string',
    title: title,
    enum: titleMap.map(item => item.value),
    enumNames: titleMap.map(item => item.name),
  }
};

export const unwrapFormDataSelectValues = (data) => {
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