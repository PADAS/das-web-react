import customSchemaFields from '../SchemaFields';
import isUndefined from 'lodash/isUndefined';
import isString from 'lodash/isString';
import merge from 'lodash/merge';
import uniq from 'lodash/uniq';

import { COLUMN_CLASS_PREFIXES } from '../constants';

const GLOBAL_UI_SCHEMA_CONFIG = {
  details: {
    'ui:widget': 'textarea',
  },
  Details: {
    'ui:widget': 'textarea',
  },
};

const extractRequiredPropsFromSchemaAndDefinition = (schema = { properties: {} }, definition = []) => {
  const fromProps = Object.entries(schema.properties).reduce((accumulator, [key, value], index) => {
    if (value.type === 'object') {
      return [...accumulator, ...extractRequiredPropsFromSchemaAndDefinition(value)];
    }
    if (value.required) return [...accumulator, key];
    return accumulator;
  }, []);

  const fromDefs = definition.reduce((accumulator, def) => def.required ? [...accumulator, def.key] : accumulator, []);
  const fromSchema = schema?.required || [];

  return [...fromSchema, ...fromDefs, ...fromProps];
};

const createSchemaGroups = (schema, definitions) => {
  const INFERRED_ORIGIN = 'inferred';
  const DEFINED_ORIGIN = 'fieldset';

  if (!definitions || !definitions.length) return [{
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
          items: value.items.map(item => isString(item) ? item : item.key),
        }
      ];
    }

    if (isObject && value.type === 'help') {
      return [
        ...accumulator,
        {
          origin: DEFINED_ORIGIN,
          type: 'fieldset',
          title: value.helpvalue.replace(/(<([^>]+)>)/ig, ''),
          items: [],
        },
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
      if (
        !accumulator.length
        || accumulator[accumulator.length - 1].origin !== INFERRED_ORIGIN
      ) {
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

export const generateFormSchemasFromEventTypeSchema = ({ definition: definitions, schema: originalSchema }) => {
  const withEnums = convertSchemaEnumNameObjectsIntoArray({ ...originalSchema });

  const { 
    schema:schemaFromDefinitions,
    uiSchema:uiSchemaFromDefinitions 
  } = convertDefinitionsToSchemas(definitions, withEnums);

  const uiSchemasForSelectFields = addCustomSelectFieldForEnums(withEnums);
  const uiSchemasForExternalURIs = addCustomLinksForExternalURIs(withEnums);

  const groupsForSchema = createSchemaGroups(withEnums, definitions);

  const schema = merge(withEnums, { properties: schemaFromDefinitions });
  const uiSchema = merge({ ...GLOBAL_UI_SCHEMA_CONFIG }, uiSchemaFromDefinitions, uiSchemasForSelectFields, uiSchemasForExternalURIs);

  const requiredProperties = extractRequiredPropsFromSchemaAndDefinition(schema, definitions);
  schema.required = requiredProperties;

  uiSchema['ui:groups'] = groupsForSchema;
  
  return {
    schema,
    uiSchema,
  };
};

const convertDefinitionsToSchemas = (definitions = [], schema) => {
  const definitionsToConvert = definitions.filter(d => (typeof d !== 'string'));

  return definitionsToConvert.reduce((accumulator, definition, index) => {
    const { items, key, layout, type, fieldHtmlClass, htmlClass } = definition;

    let result = {};
    let recursedValues = {};

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
      recursedValues = merge(result, convertDefinitionsToSchemas(items.filter(i => typeof i === 'object'), schema));
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

    if (!result.schemaEntry || !result.schemaEntry.key) return merge(accumulator, recursedValues);

    return merge(accumulator, recursedValues, {
      schema: {
        [result.schemaEntry.key]: result.schemaEntry,
      },
      uiSchema: {
        [result.schemaEntry.key]: result.uiSchemaEntry,
      }
    });
  }, {});
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
      inactive_enum: definition.inactive_titleMap || null,
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
    if (value.type === 'object') {
      return merge(accumulator, {
        [key]: addCustomSelectFieldForEnums(value),
      });
    }
    if (value.type === 'array' && !!value.items  && value.items.type === 'object') {
      return merge(accumulator, {
        [key]: {
          items: addCustomSelectFieldForEnums(value.items),
        }
      });
    }
    return accumulator;
  }, {});
};

const generateUiSchemaForSelectFields = (key) => {
  return {
    [key]: {
      'ui:widget': customSchemaFields.select,
    }
  };
};

const addCustomLinksForExternalURIs = (schema) => Object.entries(schema.properties)
  .reduce((accumulator, [key, value]) => {
    if (value.format && value.format === 'uri') {
      return merge(accumulator, {
        [key]: {
          'ui:field': customSchemaFields.externalUri,
        }, 
      });
    }
    if (value.type === 'object') {
      return merge(accumulator, {
        [key]: addCustomLinksForExternalURIs(value),
      });
    }
    return accumulator;
  }, {});
