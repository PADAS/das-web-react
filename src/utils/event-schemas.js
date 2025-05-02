export const getLinearErrorPropTree = (errorProperty) => {
  const nonPropAccessorNotations = /'|\.properties|\[|\]|\.enumNames|\.enum/g;
  return errorProperty.replace(nonPropAccessorNotations, '.')
    .split('.')
    .filter(p => !!p)
    .map(item => isNaN(item) ? item : parseFloat(item));
};

export const filterOutRequiredValueOnSchemaPropErrors = errors => errors.filter(err => !JSON.stringify(err).includes('required should be array'));

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
