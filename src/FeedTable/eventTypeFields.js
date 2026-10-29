import isPlainObject from 'lodash/isPlainObject';
import startCase from 'lodash/startCase';
import uniq from 'lodash/uniq';

import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID } from '../utils/form-schemas/constants';
import getHumanizedFieldValue from '../utils/form-schemas/getHumanizedFieldValue';
import normalizeChoiceListValues from '../utils/form-schemas/normalizeChoiceListValues';
import transformSchemaToFormElements from '../utils/form-schemas/transformSchemaToFormElements';

// A field of one event type, as a table column: `key` in event_details, a
// `label`, whether its value is `complex` (opened rather than shown), whether
// it `isDate`, and `toText(eventDetails)` for the simple ones.

const isLegacyChoice = (value) => isPlainObject(value) && typeof value.name === 'string' && 'value' in value;

const joinValues = (value) => Array.isArray(value) ? value.join(', ') : value;

const textOrEmpty = (value) => value === null || value === undefined ? '' : String(joinValues(value));

const V1_DATE_FORMATS = ['date', 'date-time'];

const v1ChoiceLabel = (choices, value) => {
  const choiceValue = isLegacyChoice(value) ? value.value : value;
  const index = choices.enum?.indexOf(choiceValue) ?? -1;

  if (index >= 0 && choices.enumNames?.[index] !== undefined) return choices.enumNames[index];
  return isLegacyChoice(value) ? value.name : choiceValue;
};

const fieldFromV1Property = (key, property, uiSchema) => {
  const isArray = property.type === 'array';
  const choices = isArray
    ? { enum: property.items?.enum, enumNames: uiSchema?.[key]?.items?.['ui:enumNames'] }
    : { enum: property.enum, enumNames: uiSchema?.[key]?.['ui:enumNames'] ?? property.enumNames };

  return {
    complex: property.type === 'object' || (isArray && property.items?.type === 'object'),
    isDate: V1_DATE_FORMATS.includes(property.format),
    key,
    label: property.title || startCase(key),
    toText: (eventDetails) => {
      const value = eventDetails?.[key];
      if (value === null || value === undefined) return '';

      return textOrEmpty(isArray && Array.isArray(value)
        ? value.map((item) => v1ChoiceLabel(choices, item))
        : v1ChoiceLabel(choices, value));
    },
  };
};

export const fieldsFromV1Schema = ({ schema, uiSchema }) => {
  const properties = schema?.properties ?? {};
  const orderedKeys = uniq([
    ...(uiSchema?.['ui:groups'] ?? []).flatMap((group) => group.items),
    ...Object.keys(properties),
  ]).filter((key) => !!properties[key]);

  return orderedKeys.map((key) => fieldFromV1Property(key, properties[key], uiSchema));
};

export const fieldsFromV2Schema = (schema, coordinatesRepresentation) => {
  const formElements = transformSchemaToFormElements(schema);

  return formElements[ROOT_CANVAS_ID].details.sections
    .flatMap((sectionId) => [
      ...formElements[sectionId].details.leftColumn,
      ...(formElements[sectionId].details.rightColumn ?? []),
    ])
    .map((elementId) => formElements[elementId])
    .filter((element) => element.type !== FORM_ELEMENT_TYPES.HEADER)
    .map((field) => ({
      complex: field.type === FORM_ELEMENT_TYPES.COLLECTION,
      isDate: false,
      key: field.details.value,
      label: field.details.label || startCase(field.details.value),
      toText: (eventDetails) => textOrEmpty(getHumanizedFieldValue(
        field,
        normalizeChoiceListValues(eventDetails ?? {}, formElements)[field.details.value],
        '',
        coordinatesRepresentation
      )),
    }));
};

// Without a schema, the loaded values are all there is to go on.
const isComplexValue = (value) => Array.isArray(value)
  ? value.some((item) => isPlainObject(item) && !isLegacyChoice(item))
  : isPlainObject(value) && !isLegacyChoice(value);

export const fieldsFromEventDetails = (events) => uniq(events.flatMap((event) => Object.keys(event.event_details ?? {})))
  .map((key) => ({
    complex: events.some((event) => isComplexValue(event.event_details?.[key])),
    isDate: false,
    key,
    label: startCase(key),
    toText: (eventDetails) => {
      const value = eventDetails?.[key];
      const toLabel = (item) => isLegacyChoice(item) ? item.name : item;

      return textOrEmpty(Array.isArray(value) ? value.map(toLabel) : toLabel(value));
    },
  }));
