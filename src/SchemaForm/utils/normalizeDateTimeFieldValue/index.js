import { format, isValid, parseISO } from 'date-fns';

import {
  DATE_TIME_ELEMENT_INPUT_TYPES,
} from '../../../utils/form-schemas/constants';

const normalizeDateTimeFieldValue = (value, inputType) => {
  if (!value) {
    return value;
  }

  switch (inputType) {
  case DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME: {
    // Normalize the separator to be "T".
    const normalizedValue = value.replace(' ', 'T');

    // If the value is already a valid date-time, format it so it gets timezone
    // corrected.
    const parsedDateTimeValue = parseISO(normalizedValue);
    return isValid(parsedDateTimeValue)
      ? format(parsedDateTimeValue, 'yyyy-MM-dd\'T\'HH:mm:ssXXX')
      : normalizedValue;
  }

  case DATE_TIME_ELEMENT_INPUT_TYPES.TIME: {
    // Add a dummy date so the time value can be parsed.
    const parsedTimeValue = parseISO(
      `${format(new Date(), 'yyyy-MM-dd')}T${value}`,
    );
    // If the value is already a valid time, format it so it gets timezone
    // corrected.
    return isValid(parsedTimeValue)
      ? format(parsedTimeValue, 'HH:mm:ssXXX')
      : value;
  }

  default:
    return value;
  }
};

export default normalizeDateTimeFieldValue;
