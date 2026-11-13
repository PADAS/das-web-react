import getHumanizedFieldValue from '../../../../../../utils/form-schemas/getHumanizedFieldValue';

export const getItemTitle = (
  formData,
  itemIdentifierFieldName,
  defaultTitle,
  identifierField,
  coordinatesRepresentation
) => !itemIdentifierFieldName || !formData[itemIdentifierFieldName]
  ? defaultTitle
  : getHumanizedFieldValue(
    identifierField,
    formData[itemIdentifierFieldName],
    defaultTitle,
    coordinatesRepresentation
  );
