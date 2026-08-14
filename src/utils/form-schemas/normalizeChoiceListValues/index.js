import { isPlainObject } from 'lodash-es';

// Some events store a choice as the whole option object rather than its value, from a time when
// the field was a collection. Requiring exactly these two keys keeps collection items that happen
// to have a `value` field, and the `{ option: true }` maps that section conditions use, untouched.
const isLegacyChoiceValue = (value) => isPlainObject(value)
  && Object.keys(value).length === 2
  && typeof value.name === 'string'
  && ['boolean', 'number', 'string'].includes(typeof value.value);

// Both helpers return the original container when nothing changed, so untouched form data keeps its
// identity and does not retrigger memos downstream.
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
