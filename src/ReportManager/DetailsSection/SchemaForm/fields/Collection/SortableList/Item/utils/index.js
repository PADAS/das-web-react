import getHumanizedFieldValue from '../../../../../../../../utils/v2-event-schemas/getHumanizedFieldValue';

export const getItemTitle = (
  formData,
  identifierName,
  defaultTitle,
  identifierField,
  language,
  coordinatesRepresentation,
  t
) => !identifierName || !formData[identifierName]
  ? defaultTitle
  : getHumanizedFieldValue(
    identifierField,
    formData[identifierName],
    defaultTitle,
    language,
    coordinatesRepresentation,
    t
  );
