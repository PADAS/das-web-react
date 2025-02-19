import { format, isValid, parseISO } from 'date-fns';

import { DATE_TIME_ELEMENT_INPUT_TYPES, FORM_ELEMENT_TYPES } from '../../../../../constants';
import { shouldUse12HourFormat } from '../../../../../../../../utils/datetime';

const getChoiceListOptionLabel = (value, field) => {
  return field.details.options.find((option) => option.const === value)?.title;
};

// Utility to calculate a human readable version of the field values. For example, render a date-time like
// 2020/01/01 12:00 PM instead of 2020-01-01T12:00:00Z.
export const getHumanizedValue = (field, value, defaultHumanizedValue, language, t) => {
  if (!value) {
    return defaultHumanizedValue;
  }

  const use12HourFormat = shouldUse12HourFormat(language);

  switch (field.type) {
  case FORM_ELEMENT_TYPES.COLLECTION:
    return t('collectionHumanizedValue', { collectionLength: value.length });

  case FORM_ELEMENT_TYPES.CHOICE_LIST:
    if (field.details.multiple) {
      const humanizedValues = value.map((val) => {
        return getChoiceListOptionLabel(val, field);
      });
      return humanizedValues.join(', ');
    }
    return getChoiceListOptionLabel(value, field);

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
    return `${value.latitude}°, ${value.longitude}°`;

  default:
    return value;
  };
};

export const getItemTitle = (formData, identifier, defaultTitle, identifierField, language, t) =>
  !identifier || !formData[identifier]
    ? defaultTitle
    : getHumanizedValue(identifierField, formData[identifier], defaultTitle, language, t);
