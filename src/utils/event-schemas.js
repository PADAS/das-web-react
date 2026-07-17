import { get } from 'lodash-es';

export const getLinearErrorPropTree = (errorProperty) => {
  if (errorProperty == null || typeof errorProperty !== 'string') {
    return [];
  }
  const nonPropAccessorNotations = /'|\.properties|\[|\]|\.enumNames|\.enum/g;
  return errorProperty.replace(nonPropAccessorNotations, '.')
    .split('.')
    .filter(p => !!p)
    .map(item => isNaN(item) ? item : parseFloat(item));
};

export const filterOutRequiredValueOnSchemaPropErrors = errors => errors.filter(err => !JSON.stringify(err).includes('required should be array'));

const isFieldRequired = (schema, propPath) => {
  let currentSchema = schema;

  for (let index = 0; index < propPath.length; index += 1) {
    const key = propPath[index];
    if (index === propPath.length - 1) {
      return !!currentSchema?.required?.includes(key);
    }

    currentSchema = typeof key === 'number' ? currentSchema?.items : currentSchema?.properties?.[key];
  }

  return false;
};

export const filterOutEnumErrorsForClearedFields = (errors, eventDetails, schema) => {
  const details = eventDetails ?? {};

  return errors.filter((err) => {
    if (err.name !== 'enum') {
      return true;
    }

    const propPath = getLinearErrorPropTree(err.property);
    const value = get(details, propPath);
    const isCleared = value === '' || value === undefined;

    return !isCleared || isFieldRequired(schema, propPath);
  });
};

export const filterOutErrorsForHiddenProperties = (errors, uiSchema) => {
  const propsInForm =
      uiSchema['ui:groups']
        .reduce((accumulator, group) => ({
          ...accumulator,
          ...group.items.reduce((accumulator, item) => ({ ...accumulator, [item]: true }), {})
        }), {});

  return errors.filter((err) => {
    const propName = getLinearErrorPropTree(err.property)[0];

    return !!propsInForm[propName];
  });
};
