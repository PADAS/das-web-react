import { isPlainObject } from 'lodash-es';

const isLegacyChoiceListValue = (value) => isPlainObject(value) && typeof value.value === 'string';

const normalizeChoiceListValue = (value) => isLegacyChoiceListValue(value) ? value.value : value;

const normalizeArrayItems = (array, normalizeItem) => {
  const normalizedArray = array.map(normalizeItem);

  // Return the normalized array if there are any changes, otherwise return the
  // original array.
  return normalizedArray.some((item, index) => item !== array[index]) ? normalizedArray : array;
};

// Choice lists are the only fields whose subschema enumerates the values they
// accept.
const isChoiceSubschema = (subschema) => (subschema?.anyOf ?? [])
  .some((choicesSubschema) => Array.isArray(choicesSubschema.enum));

const normalizeFieldValue = (value, jsonSubschema) => {
  if (!isPlainObject(jsonSubschema) || value === null || value === undefined) {
    return value;
  }

  const itemsSubschema = jsonSubschema.type === 'array' ? jsonSubschema.items : undefined;

  // Multiple choice list.
  if (isChoiceSubschema(itemsSubschema)) {
    if (Array.isArray(value)) {
      return normalizeArrayItems(value, normalizeChoiceListValue);
    }

    const normalizedValue = normalizeChoiceListValue(value);

    return normalizedValue && typeof normalizedValue === 'string' ? [normalizedValue] : value;
  }

  // Single choice list.
  if (isChoiceSubschema(jsonSubschema)) {
    return normalizeChoiceListValue(Array.isArray(value) && value.length === 1 ? value[0] : value);
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

// Repairs v2 form data written while the event type was still a v1 that accepted
// `{ name, value }` objects as choice list field values.
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
