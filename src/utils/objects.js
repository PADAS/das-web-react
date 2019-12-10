import isObject from 'lodash/isObject';
import transform from 'lodash/transform';
import isEqual from 'react-fast-compare';

export const extractObjectDifference = (object, original) => transform(object, (result, value, key) => {
  if (!isEqual(value, original[key])) {
    result[key] = isObject(value) && isObject(original[key]) ? extractObjectDifference(value, original[key]) : value;
  }
});

export const removeNullAndUndefinedValuesFromObject = obj => Object.entries(obj).reduce((a,[k,v]) => (v == null ? a : {...a, [k]:v}), {});