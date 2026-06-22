import { format, isValid, parseISO } from 'date-fns';

import { DATE_TIME_ELEMENT_INPUT_TYPES, FORM_ELEMENT_TYPES } from '../constants';
import { OUTSIDE_BBOX, stringifyCoordinates } from '../../location';
import { shouldUse12HourFormat } from '../../datetime';

const getChoiceListOptionHumanizedValue = (value, field) => {
  const option = field.details.options.find((option) => option.value === value) ?? {};

  if (!option.display) {
    return value;
  }
  if (!option.description) {
    return option.display;
  }
  return `${option.display} (${option.description})`;
};

// Utility to calculate a human readable version of the field values. For
// example, render a date-time like 2020/01/01 12:00 PM instead of
// 2020-01-01T12:00:00Z.
const getHumanizedFieldValue = (field, value, defaultHumanizedValue, language, coordinatesRepresentation, t) => {
  if (value === undefined) {
    return defaultHumanizedValue;
  }

  const use12HourFormat = shouldUse12HourFormat(language);

  switch (field.type) {
  case FORM_ELEMENT_TYPES.ATTACHMENT:
    return value.length === 0
      ? defaultHumanizedValue
      : t('attachmentHumanizedValue', { count: value.length });

  case FORM_ELEMENT_TYPES.CHOICE_LIST:
    if (field.details.multiple) {
      return value.map((choiceValue) => getChoiceListOptionHumanizedValue(choiceValue, field)).join(', ');
    }
    return getChoiceListOptionHumanizedValue(value, field);

  case FORM_ELEMENT_TYPES.COLLECTION:
    return t('collectionHumanizedValue', { collectionLength: value.length });

  case FORM_ELEMENT_TYPES.DATE_TIME:
    let parsedDate;
    let formatStr;
    switch (field.details.inputType) {
    case DATE_TIME_ELEMENT_INPUT_TYPES.DATE:
      parsedDate = parseISO(value);
      formatStr = 'yyyy/MM/dd';
      break;

    case DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME:
      parsedDate = parseISO(value);
      formatStr = use12HourFormat ? 'yyyy/MM/dd hh:mm a' : 'yyyy/MM/dd HH:mm';
      break;

    case DATE_TIME_ELEMENT_INPUT_TYPES.TIME:
      parsedDate = parseISO(`2000-01-01T${value}`);
      formatStr = use12HourFormat ? 'hh:mm a' : 'HH:mm';
      break;

    default:
      return defaultHumanizedValue;
    }
    return isValid(parsedDate) ? format(parsedDate, formatStr) : defaultHumanizedValue;

  case FORM_ELEMENT_TYPES.LOCATION:
    const coordinatesString = stringifyCoordinates(value, coordinatesRepresentation);
    return coordinatesString === OUTSIDE_BBOX ? defaultHumanizedValue : coordinatesString;

  default:
    return value;
  };
};

export default getHumanizedFieldValue;
