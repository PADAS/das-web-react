import { isPlainObject } from 'lodash-es';

import { FORM_ELEMENT_TYPES } from '../constants';

const isLegacyChoiceValue = (value) => isPlainObject(value)
  && typeof value.name === 'string'
  && ['boolean', 'number', 'string'].includes(typeof value.value);

const normalizeChoiceValue = (value) => isLegacyChoiceValue(value) ? value.value : value;

const normalizeArrayItems = (array, normalizeItem) => {
  const normalizedArray = array.map(normalizeItem);

  return normalizedArray.some((item, index) => item !== array[index]) ? normalizedArray : array;
};

const normalizeObjectValues = (object, normalizeValue) => {
  const normalizedEntries = Object.entries(object).map(([key, value]) => [key, normalizeValue(value, key)]);

  return normalizedEntries.some(([key, value]) => value !== object[key])
    ? Object.fromEntries(normalizedEntries)
    : object;
};

const normalizeFieldValues = (formData, formElements, parentCollectionFieldId = null) => {
  if (!isPlainObject(formData)) {
    return formData;
  }

  return normalizeObjectValues(formData, (value, fieldName) => {
    const fieldId = parentCollectionFieldId ? `${parentCollectionFieldId}.${fieldName}` : fieldName;

    switch (formElements[fieldId]?.type) {
    case FORM_ELEMENT_TYPES.CHOICE_LIST:
      return Array.isArray(value) ? normalizeArrayItems(value, normalizeChoiceValue) : normalizeChoiceValue(value);

    case FORM_ELEMENT_TYPES.COLLECTION:
      return Array.isArray(value)
        ? normalizeArrayItems(value, (item) => normalizeFieldValues(item, formElements, fieldId))
        : value;

    default:
      return value;
    }
  });
};

// Replaces the values of the choice list fields described by formElements from
// { name, value } format to their value.
const normalizeChoiceListValues = (formData, formElements) => isPlainObject(formElements)
  ? normalizeFieldValues(formData, formElements)
  : formData;

export default normalizeChoiceListValues;
