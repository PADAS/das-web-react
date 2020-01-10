import customSchemaFields from '../SchemaFields';
import isUndefined from 'lodash/isUndefined';

const GLOBAL_UI_SCHEMA_CONFIG = {
  details: {
    'ui:widget': 'textarea',
  },
};

const createSchemaGroups = (schema, definitions) => {
  const INFERRED_ORIGIN = 'inferred';
  const DEFINED_ORIGIN = 'fieldset';

  if (!definitions.length) return Object.keys(schema.properties);

  return definitions.reduce((accumulator, value, index, src) => {
    const isFirst = isUndefined(src[index - 1]);

    /* const item = {
      title: <String> || null,
      items: [<String>],
      origin:  'inferred' || 'fieldset'
    } */

    if (typeof value === 'string') {
      if (isFirst || accumulator[accumulator.length - 1].origin !== INFERRED_ORIGIN) {
        return [
          ...accumulator,
          {
            origin: INFERRED_ORIGIN,
            title: null,
            items: [value],
          }
        ];
      } else {
        const copy = [...accumulator];
        copy[copy.length - 1] = {
          ...copy[copy.length - 1],
          items: [...copy[copy.length - 1].items, value],
        };
        return copy;
      }
    } else if (typeof value === 'object') {
      if (value.type === 'fieldset') {
        return [
          ...accumulator,
          {
            origin: DEFINED_ORIGIN,
            ...value,
          }
        ];
      } else if (isFirst || accumulator[accumulator.length - 1].origin !== INFERRED_ORIGIN) {
        return [
          ...accumulator,
          {
            origin: INFERRED_ORIGIN,
            title: null,
            items: [value.key],
          }
        ];
      } else {
        const copy = [...accumulator];
        copy[copy.length - 1] = {
          ...copy[copy.length - 1],
          items: [...copy[copy.length - 1].items, value.key],
        };
        return copy;
      }
    }
    return null;
  }, []);
};

export const generateFormSchemasFromEventTypeSchema = ({ definition: definitions, schema }) => {
  const newSchema = { ...schema };
  const uiSchema = { ...GLOBAL_UI_SCHEMA_CONFIG };

  const withEnums = convertSchemaEnumNameObjectsIntoArray(newSchema);

  const schemasFromDefinitions = convertDefinitionsToSchemas(definitions, schema);
  const schemasForSelectFields = addCustomSelectFieldForEnums(schema);
  const schemasForExternalURIs = addCustomLinksForExternalURIs(schema);
  const groupsForSchema = createSchemaGroups(schema, definitions);

  const toUpdate = [...schemasFromDefinitions, ...schemasForSelectFields, ...schemasForExternalURIs];

  toUpdate.forEach(({ schemaEntry, uiSchemaEntry }) => {
    withEnums.properties[schemaEntry.key] = { ...withEnums.properties[schemaEntry.key], ...schemaEntry };
    if (uiSchemaEntry) {
      uiSchema[schemaEntry.key] = uiSchemaEntry;
    }
  });

  uiSchema['ui:groups'] = groupsForSchema;

  return {
    schema: withEnums,
    uiSchema,
  };
};

const convertDefinitionsToSchemas = (definitions = [], schema) => {
  const definitionsToConvert = definitions.filter(d => (typeof d !== 'string') && !!schema.properties[d.key]);

  return definitionsToConvert.reduce((accumulator, definition) => {
    const { type, fieldHtmlClass, htmlClass } = definition;

    if (type === 'checkboxes') {
      return [...accumulator, generateSchemaAndUiSchemaForCheckbox(definition)];
    }
    if (type === 'datetime' || (fieldHtmlClass && fieldHtmlClass.includes('date-time-picker'))) {
      return [...accumulator, generateSchemaAndUiSchemaForDateField(definition)];
    }
    if (type === 'textarea') {
      return [...accumulator, generateSchemaAndUiSchemaForTextarea(definition)];
    }
    if (fieldHtmlClass || htmlClass) {
      return [...accumulator, addCssClassesToDefinition(definition)];
    }
    return accumulator;
  }, []);
};

const addCssClassesToDefinition = ({ key, fieldHtmlClass, htmlClass }) => {
  const entry = {
    schemaEntry: {
      key,
    },
    uiSchemaEntry: {
    }
  };
  if (fieldHtmlClass) entry.uiSchemaEntry['ui:fieldClassNames'] = fieldHtmlClass;
  if (htmlClass) entry.uiSchemaEntry.classNames = htmlClass;
  return entry;
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
      'ui:widget': customSchemaFields.checkboxes,
    },
  };
};

const generateSchemaAndUiSchemaForDateField = ({ key }) => ({
  schemaEntry: {
    key,
  },
  uiSchemaEntry: {
    'ui:field': customSchemaFields.datetime,
  },
});

const generateSchemaAndUiSchemaForTextarea = ({ key }) => ({
  schemaEntry: {
    key,
  },
  uiSchemaEntry: {
    'ui:widget': 'textarea',
  },
});



const addCustomSelectFieldForEnums = (schema) => {
  return Object.entries(schema.properties).reduce((accumulator, [key, value]) => {
    if (value.hasOwnProperty('enum')) {
      return [...accumulator, generateSchemaAndUiSchemaForSelect(key)];
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
  };
};

const addCustomLinksForExternalURIs = (schema) => Object.entries(schema.properties)
  .filter(([key, value]) => value.format && value.format === 'uri')
  .map(([key]) => ({
    schemaEntry: {
      key,
    },
    uiSchemaEntry: {
      'ui:field': customSchemaFields.externalUri,
    },
  }));