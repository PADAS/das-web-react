import getHumanizedFieldValue from '../../../../../../utils/form-schemas/getHumanizedFieldValue';

export const getItemTitle = (
  formData,
  itemIdentifierFieldName,
  defaultTitle,
  identifierField,
  language,
  coordinatesRepresentation,
  t
) => !itemIdentifierFieldName || !formData[itemIdentifierFieldName]
  ? defaultTitle
  : getHumanizedFieldValue(
    identifierField,
    formData[itemIdentifierFieldName],
    defaultTitle,
    language,
    coordinatesRepresentation,
    t
  );
