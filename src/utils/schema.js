import { EVENT_FILTER_SCHEMA_HIDDEN_PROPS } from '../constants';

export const deleteHiddenSchemaProps = schema => {
  EVENT_FILTER_SCHEMA_HIDDEN_PROPS.forEach(prop => delete schema[prop]);
}

export const generateEnumAndNamesFromEnumOfObjects = (originalArray) => {
  const ids = originalArray.map(item => item.id);
  const displayNames = originalArray.map(item => item.display);
  return { enum: ids, enumNames: displayNames };
};