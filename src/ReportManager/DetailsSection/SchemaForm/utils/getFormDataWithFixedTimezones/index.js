import { format, isValid, parseISO } from 'date-fns';

import {
  DATE_TIME_ELEMENT_INPUT_TYPES,
  FORM_ELEMENT_TYPES,
} from '../../../../../utils/v2-event-schemas/constants';

const correctDateTimeValue = (value, inputType) => {
  switch (inputType) {
  case DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME: {
    const parsedDateTimeValue = parseISO(value);
    return isValid(parsedDateTimeValue)
      ? format(parsedDateTimeValue, 'yyyy-MM-dd\'T\'HH:mm:ssXXX')
      : value;
  }

  case DATE_TIME_ELEMENT_INPUT_TYPES.TIME: {
    const parsedTimeValue = parseISO(
      `${format(new Date(), 'yyyy-MM-dd')}T${value}`,
    );
    return isValid(parsedTimeValue)
      ? format(parsedTimeValue, 'HH:mm:ssXXX')
      : value;
  }

  default:
    return value;
  }
};

const fixTimezoneRecursively = (formData, formElements) => {
  const newFormData = {};

  Object.entries(formData).forEach(([fieldId, fieldValue]) => {
    switch (formElements[fieldId]?.type) {
    case FORM_ELEMENT_TYPES.COLLECTION:
      if (Array.isArray(fieldValue)) {
        newFormData[fieldId] = fieldValue.map(
          (item) => fixTimezoneRecursively(item, formElements)
        );
      } else {
        newFormData[fieldId] = fieldValue;
      }
      break;

    case FORM_ELEMENT_TYPES.DATE_TIME:
      if (typeof fieldValue === 'string') {
        newFormData[fieldId] = correctDateTimeValue(
          fieldValue,
          formElements[fieldId].details.inputType
        );
      } else {
        newFormData[fieldId] = fieldValue;
      }
      break;

    default:
      newFormData[fieldId] = fieldValue;
    }
  });

  return newFormData;
};

const getFormDataWithFixedTimezones = (formData, formElements) =>
  fixTimezoneRecursively(formData, formElements);

export default getFormDataWithFixedTimezones;
