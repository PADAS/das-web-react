import customSchemaFields from '../SchemaFields';
import isUndefined from 'lodash/isUndefined';
import merge from 'lodash/merge';
import uniq from 'lodash/uniq';

import { COLUMN_CLASS_PREFIXES } from '../constants';

const GLOBAL_UI_SCHEMA_CONFIG = {
  details: {
    'ui:widget': 'textarea',
  },
};

const createSchemaGroups = (schema, definitions) => {
  const INFERRED_ORIGIN = 'inferred';
  const DEFINED_ORIGIN = 'fieldset';

  if (!definitions.length) return [{
    origin: INFERRED_ORIGIN,
    items: Object.keys(schema.properties),
  }];

  return definitions.reduce((accumulator, value, index, src) => {
    const isFirst = isUndefined(src[index - 1]);
    const isObject = typeof value === 'object';
    const val = isObject ? value.key : value;


    if (isObject && value.type === 'fieldset') {
      return [
        ...accumulator,
        {
          origin: DEFINED_ORIGIN,
          ...value,
        }
      ];
    }
    
    if (isFirst) {
      return [
        ...accumulator,
        {
          origin: INFERRED_ORIGIN,
          items: [val],
        }
      ];
    }

    if (!isObject || val) {
      if (accumulator[accumulator.length - 1].origin !== INFERRED_ORIGIN) {
        return [
          ...accumulator,
          {
            origin: INFERRED_ORIGIN,
            items: uniq([val]),
          }
        ];
      } else {
        const copy = [...accumulator];
        copy[copy.length - 1] = {
          ...copy[copy.length - 1],
          items: uniq([...copy[copy.length - 1].items, val]),
        };
        return copy;
      }
    }
    return accumulator;
  }, []);
};

export const generateFormSchemasFromEventTypeSchema = ({ definition: definitions, schema }) => {
  const newSchema = { ...schema };
  const withEnums = convertSchemaEnumNameObjectsIntoArray(newSchema);

  const schemasFromDefinitions = convertDefinitionsToSchemas(definitions, schema);
  const schemasForSelectFields = addCustomSelectFieldForEnums(schema);
  const schemasForExternalURIs = addCustomLinksForExternalURIs(schema);
  const groupsForSchema = createSchemaGroups(schema, definitions);
  
  const updates = merge(withEnums.properties, schemasFromDefinitions.schema, schemasForSelectFields.schema, schemasForExternalURIs.schema);
  const uiSchema = merge(GLOBAL_UI_SCHEMA_CONFIG, schemasFromDefinitions.uiSchema, schemasForSelectFields.uiSchema, schemasForExternalURIs.uiSchema);

  uiSchema['ui:groups'] = groupsForSchema;
  
  return {
    schema: {
      ...withEnums,
      properties: merge(withEnums.properties, updates),
    },
    uiSchema,
  };
};

const convertDefinitionsToSchemas = (definitions = [], schema) => {
  const definitionsToConvert = definitions.filter(d => (typeof d !== 'string'));

  const final = definitionsToConvert.reduce((accumulator, definition) => {
    const { items, key, layout, type, fieldHtmlClass, htmlClass } = definition;

    let result = {};

    if (type === 'checkboxes') {
      result = merge(result, generateSchemaAndUiSchemaForCheckbox(definition, schema));
    }
    if (type === 'datetime' || (fieldHtmlClass && fieldHtmlClass.includes('date-time-picker'))) {
      result = merge(result, generateSchemaAndUiSchemaForDateField(definition));
    }
    if (type === 'textarea') {
      result = merge(result, generateSchemaAndUiSchemaForTextarea(definition));
    }
    if (type === 'fieldset' && !!items && items.some(i => typeof i === 'object')) {
      result = merge(result, convertDefinitionsToSchemas(items.filter(i => typeof i === 'object'), schema));
    }
    if (key && (fieldHtmlClass || htmlClass || layout)) {
      result = merge(result, addCssClassesToDefinition(definition));
    }

    if (key && !result.schemaEntry) {
      result = merge(result, {
        schemaEntry: {
          key,
        },
      });
    }

    if (!result.schemaEntry || !result.schemaEntry.key) return accumulator;

    return merge(accumulator, {
      schema: {
        [result.schemaEntry.key]: result.schemaEntry,
      },
      uiSchema: {
        [result.schemaEntry.key]: result.uiSchemaEntry,
      }
    });
  }, {});
  return final;
};

const convertSchemaLayoutToColumnClassString = ({ sm, md, lg }) => {
  let val = '';
  if (sm) val += ` ${COLUMN_CLASS_PREFIXES.sm}${sm}`;
  if (md) val += ` ${COLUMN_CLASS_PREFIXES.md}${md}`;
  if (lg) val += ` ${COLUMN_CLASS_PREFIXES.lg}${lg}`;
  return val;
};

const addCssClassesToDefinition = ({ key, fieldHtmlClass, htmlClass, layout }) => {
  const entry = {
    schemaEntry: {
      key,
    },
    uiSchemaEntry: {
    }
  };
  // if (fieldHtmlClass) entry.uiSchemaEntry['ui:fieldClassNames'] = fieldHtmlClass; this doesn't do anything, currently
  if (layout) {
    const columnClasses = convertSchemaLayoutToColumnClassString(layout);
    entry.uiSchemaEntry.classNames = columnClasses;
  }
  if (htmlClass) entry.uiSchemaEntry.classNames = `${entry.uiSchemaEntry.classNames || ''} ${htmlClass}`;
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

const generateSchemaAndUiSchemaForCheckbox = (definition, schema) => {
  const { key, title:definitionTitle, titleMap:definitionTitleMap } = definition;
  const { titleMap:schemaTitleMap, title:schemaTitle } = schema.properties[key];

  const title = schemaTitle || definitionTitle;
  const titleMap = schemaTitleMap || definitionTitleMap;

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
      return merge(accumulator, generateUiSchemaForSelectFields(key));
    }
    return accumulator;
  }, {});
};

const generateUiSchemaForSelectFields = (key) => {
  return {
    uiSchema: {
      [key]: {
        'ui:widget': customSchemaFields.select,
      }
    },
  };
};

const addCustomLinksForExternalURIs = (schema) => Object.entries(schema.properties)
  .filter(([_key, value]) => value.format && value.format === 'uri')
  .map(([key]) => ({
    uiSchema: {
      [key]: {
        'ui:field': customSchemaFields.externalUri,
      },
    },
  }));