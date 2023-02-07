import isPlainObject from 'lodash/isPlainObject';
import transform from 'lodash/transform';
import isEqual from 'react-fast-compare';

export const extractObjectDifference = (object, original) => transform(object, (result, value, key) => {
  if (!isEqual(value, original[key])) {
    if (isPlainObject(value) && isPlainObject(original[key])) {
      const objectDifference = extractObjectDifference(value, original[key]);

      if (Object.keys(objectDifference).length > 0) {
        result[key] = objectDifference;
      }
    } else {
      result[key] = value;
    }
  }
});

export const removeNullAndUndefinedValuesFromObject = obj => Object.entries(obj).reduce((a, [k, v]) => (v == null ? a : { ...a, [k]: v }), {});