import getHumanizedFieldValue from '../../../../../../../../utils/v2-event-schemas/getHumanizedFieldValue';

export const getItemTitle = (
  formData,
  identifier,
  defaultTitle,
  identifierField,
  language,
  coordinatesRepresentation,
  t
) => !identifier || !formData[identifier]
  ? defaultTitle
  : getHumanizedFieldValue(
    identifierField,
    formData[identifier],
    defaultTitle,
    language,
    coordinatesRepresentation,
    t
  );
