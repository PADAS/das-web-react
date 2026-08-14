import { isPlainObject } from 'lodash-es';

const isLegacyChoiceListValue = (value) => isPlainObject(value)
  && ['boolean', 'number', 'string'].includes(typeof value.value);

const normalizeChoiceListValue = (value) => isLegacyChoiceListValue(value) ? value.value : value;

const normalizeArrayItems = (array, normalizeItem) => {
  const normalizedArray = array.map(normalizeItem);

  // Return the normalized array if there are any changes, otherwise return the
  // original array.
  return normalizedArray.some((item, index) => item !== array[index]) ? normalizedArray : array;
};

const isV2ChoiceSubschema = (subschema) => (subschema?.anyOf ?? [])
  .some((choicesSubschema) => Array.isArray(choicesSubschema.enum));

const isV1ChoiceSubschema = (subschema) => Array.isArray(subschema?.enum)
  && subschema.enum.length > 0
  && !subschema.enum.some(isPlainObject);

const normalizeFieldValue = (value, jsonSubschema) => {
  if (!isPlainObject(jsonSubschema) || value === null || value === undefined) {
    return value;
  }

  const itemsSubschema = jsonSubschema.type === 'array' ? jsonSubschema.items : undefined;

  if (isV2ChoiceSubschema(itemsSubschema)) {
    if (Array.isArray(value)) {
      return normalizeArrayItems(value, normalizeChoiceListValue);
    }
    return value === '' ? [] : [normalizeChoiceListValue(value)];
  }

  if (isV2ChoiceSubschema(jsonSubschema)) {
    return normalizeChoiceListValue(Array.isArray(value) ? value[0] : value);
  }

  if (isV1ChoiceSubschema(itemsSubschema) || isV1ChoiceSubschema(jsonSubschema)) {
    return Array.isArray(value)
      ? normalizeArrayItems(value, normalizeChoiceListValue)
      : normalizeChoiceListValue(value);
  }

  // Collection.
  if (isPlainObject(itemsSubschema?.properties)) {
    return Array.isArray(value)
      ? normalizeArrayItems(value, (item) => normalizeChoiceListValues(item, itemsSubschema))
      : value;
  }

  return value;
};

// The field subschema can be at its parent JSON schema properties or in a
// conditional section's "then" subschema.
const getFieldJSONSubschema = (jsonSchema, fieldName) => jsonSchema.properties?.[fieldName] ?? (jsonSchema.allOf ?? [])
  .map((conditionalSectionJSONSubschema) => conditionalSectionJSONSubschema.then?.properties?.[fieldName])
  .find(Boolean);

// Replaces choice list form data values from { name, value } format to string.
const normalizeChoiceListValues = (formData, jsonSchema) => {
  if (!isPlainObject(formData) || !isPlainObject(jsonSchema)) {
    return formData;
  }

  const normalizedEntries = Object.entries(formData).map(
    ([fieldName, fieldValue]) => [fieldName, normalizeFieldValue(fieldValue, getFieldJSONSubschema(jsonSchema, fieldName))]
  );

  // Return the normalized form data if there are any changes, otherwise return
  // the original form data object.
  return normalizedEntries.some(([fieldName, fieldValue]) => fieldValue !== formData[fieldName])
    ? Object.fromEntries(normalizedEntries)
    : formData;
};

export default normalizeChoiceListValues;
