import { FORM_FIELDS_TYPES } from '../constants';

import TextField from '../fields/Text';

const FORM_FIELDS_COMPONENTS = {
  [FORM_FIELDS_TYPES.TEXT]: TextField
};

export const getSectionDetails = (sectionName, schema) => schema.ui.sections[sectionName];

export const getHeaderDetails = (fieldName, schema) => schema.ui.headers[fieldName];

export const isFieldRequired = (fieldName, schema) => schema.json.required.includes(fieldName);

export const isSection = (fieldName, schema) => !!schema.ui.sections[fieldName];

export const isField = (fieldName, schema) => !!schema.ui.fields[fieldName];

export const getFieldUIType = (fieldName, schema) => schema.ui.fields[fieldName].type;

export const isFieldActive = (fieldName, schema) => !schema.json.properties[fieldName].deprecated;

export const getFormFieldComponent = (fieldName, schema) => FORM_FIELDS_COMPONENTS[getFieldUIType(fieldName, schema)];
