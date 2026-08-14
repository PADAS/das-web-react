import { isPlainObject } from 'lodash-es';

const isLegacyChoiceValue = (value) => isPlainObject(value)
  && Object.keys(value).length === 2
  && typeof value.name === 'string'
  && ['boolean', 'number', 'string'].includes(typeof value.value);

const normalizeArrayItems = (array, normalizeItem) => {
  const normalizedArray = array.map(normalizeItem);

  return normalizedArray.some((item, index) => item !== array[index]) ? normalizedArray : array;
};

const normalizeObjectValues = (object, normalizeValue) => {
  const normalizedEntries = Object.entries(object).map(([key, value]) => [key, normalizeValue(value)]);

  return normalizedEntries.some(([key, value]) => value !== object[key])
    ? Object.fromEntries(normalizedEntries)
    : object;
};

// Replaces choice list form data values from { name, value } format to their value.
const normalizeChoiceListValues = (formData) => {
  if (isLegacyChoiceValue(formData)) {
    return formData.value;
  }

  if (Array.isArray(formData)) {
    return normalizeArrayItems(formData, normalizeChoiceListValues);
  }

  if (isPlainObject(formData)) {
    return normalizeObjectValues(formData, normalizeChoiceListValues);
  }

  return formData;
};

export default normalizeChoiceListValues;
