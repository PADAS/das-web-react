import customSchemaFields from '../SchemaFields';

const GLOBAL_UI_SCHEMA_CONFIG = {
  details: {
    'ui:widget': 'textarea',
  },
};

export const generateFormSchemasFromEventTypeSchema = ({ definition:definitions, schema }) => {
  const newSchema = { ...schema };
  const uiSchema = { ...GLOBAL_UI_SCHEMA_CONFIG };

  const withEnums = convertSchemaEnumNameObjectsIntoArray(newSchema);

  const schemasFromDefinitions = convertDefinitionsToSchemas(definitions, schema);
  const schemasForSelectFields = addCustomSelectFieldForEnums(schema);

  const toUpdate = [...schemasFromDefinitions, ...schemasForSelectFields];

  toUpdate.forEach(({ schemaEntry, uiSchemaEntry }) => {
    withEnums.properties[schemaEntry.key] = { ...withEnums.properties[schemaEntry.key], ...schemaEntry };
    if (uiSchemaEntry) {
      uiSchema[schemaEntry.key] = uiSchemaEntry;
    }
  });
  return {
    schema: withEnums,
    uiSchema,
  };
};

const convertDefinitionsToSchemas = (definitions, schema) => {
  const definitionsToConvert = definitions.filter(d => (typeof d !== 'string') && !!schema.properties[d.key]);

  return definitionsToConvert.reduce((accumulator, definition) => {
    const { type, fieldHtmlClass } = definition;

    if (type === 'checkboxes') {
      return [...accumulator, generateSchemaAndUiSchemaForCheckbox(definition)];
    }
    if (fieldHtmlClass && fieldHtmlClass.includes('date-time-picker')) {
      return [...accumulator, generateSchemaAndUiSchemaForDateField(definition)];
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

const generateSchemaAndUiSchemaForDateField = ({ key }) => ({
    schemaEntry: {
      key,
    },
    uiSchemaEntry: {
      'ui:widget': customSchemaFields.datetime,
    },
})


const addCustomSelectFieldForEnums = (schema) => {
  return Object.entries(schema.properties).reduce((accumulator, [key, value]) => {
    if (value.hasOwnProperty('enum')) {
      return [...accumulator, generateSchemaAndUiSchemaForSelect(key)]
    }
    return accumulator;
  }, []);
};

const generateSchemaAndUiSchemaForSelect = (key) => {
  return {
    schemaEntry: {
      key,
    },
    uiSchemaEntry: {
      'ui:widget': customSchemaFields.select,
    },
  }
};

const generateSchemaAndUiSchemaForArray = (definition) => {
  console.log('definition', definition);
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