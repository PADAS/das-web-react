import { format, parseISO } from 'date-fns';

import {
  DATE_TIME_ELEMENT_INPUT_TYPES,
  FORM_ELEMENT_TYPES,
} from '../../../../../utils/v2-event-schemas/constants';

import getFormDataWithFixedTimezones from './';

// Utilities to calculate the fixed times in the current timezone.
const expectedFormattedDateTime = (dateTime) =>
  format(parseISO(dateTime), 'yyyy-MM-dd\'T\'HH:mm:ssXXX');
const expectedFormattedTime = (time) =>
  format(parseISO(`2001-01-01T${time}`), 'HH:mm:ssXXX');

describe('ReportManager - DetailsSection - SchemaForm - utils - getFormDataWithFixedTimezones', () => {
  it('does not modify the form data if it does not contain date-time form elements with date-time or time input types', () => {
    const formData = {
      date_only: '2024-03-01',
      text: 'hello',
    };
    const formElements = {
      date_only: {
        details: {
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
        },
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
      text: {
        type: FORM_ELEMENT_TYPES.TEXT,
      },
    };

    expect(getFormDataWithFixedTimezones(formData, formElements)).toEqual({
      date_only: '2024-03-01',
      text: 'hello',
    });
  });

  it('corrects the timezone of date-time fields with date-time input type', () => {
    const formData = {
      date_only: '2024-03-01',
      date_time_1: '2026-03-25T21:01:30+00:00',
      text: 'hello',
      date_time_2: '2025-07-12T02:46:14-06:00',
    };
    const formElements = {
      date_only: {
        details: {
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
        },
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
      date_time_1: {
        details: {
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
        },
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
      text: {
        type: FORM_ELEMENT_TYPES.TEXT,
      },
      date_time_2: {
        details: {
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
        },
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    };

    expect(getFormDataWithFixedTimezones(formData, formElements)).toEqual({
      date_only: '2024-03-01',
      date_time_1: expectedFormattedDateTime('2026-03-25T21:01:30+00:00'),
      text: 'hello',
      date_time_2: expectedFormattedDateTime('2025-07-12T02:46:14-06:00'),
    });
  });

  it('corrects the timezone of date-time fields with time input type', () => {
    const formData = {
      date_only: '2024-03-01',
      time_1: '21:01:30+00:00',
      text: 'hello',
      time_2: '02:46:14-06:00',
    };
    const formElements = {
      date_only: {
        details: {
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
        },
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
      time_1: {
        details: {
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.TIME,
        },
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
      text: {
        type: FORM_ELEMENT_TYPES.TEXT,
      },
      time_2: {
        details: {
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.TIME,
        },
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    };

    expect(getFormDataWithFixedTimezones(formData, formElements)).toEqual({
      date_only: '2024-03-01',
      time_1: expectedFormattedTime('21:01:30+00:00'),
      text: 'hello',
      time_2: expectedFormattedTime('02:46:14-06:00'),
    });
  });

  it('corrects the timezone of date-time fields nested in collections', () => {
    const formData = {
      date_only: '2024-03-01',
      date_time_1: '2026-03-25T21:01:30+00:00',
      text: 'hello',
      collection: [
        {
          date_time_2: '2025-07-12T02:46:14-06:00',
          nested_collection: [
            {
              date_time_3: '2022-11-04T22:52:05-02:00',
            },
          ],
        },
        {
          date_time_2: '2025-07-12T02:46:14-06:00',
        },
      ],
    };
    const formElements = {
      date_only: {
        details: {
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE,
        },
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
      date_time_1: {
        details: {
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
        },
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
      text: {
        type: FORM_ELEMENT_TYPES.TEXT,
      },
      collection: {
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
      date_time_2: {
        details: {
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
        },
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
      nested_collection: {
        type: FORM_ELEMENT_TYPES.COLLECTION,
      },
      date_time_3: {
        details: {
          inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
        },
        type: FORM_ELEMENT_TYPES.DATE_TIME,
      },
    };

    expect(getFormDataWithFixedTimezones(formData, formElements)).toEqual({
      date_only: '2024-03-01',
      date_time_1: expectedFormattedDateTime('2026-03-25T21:01:30+00:00'),
      text: 'hello',
      collection: [
        {
          date_time_2: expectedFormattedDateTime('2025-07-12T02:46:14-06:00'),
          nested_collection: [
            {
              date_time_3: expectedFormattedDateTime('2022-11-04T22:52:05-02:00'),
            },
          ],
        },
        {
          date_time_2: expectedFormattedDateTime('2025-07-12T02:46:14-06:00'),
        },
      ],
    });
  });
});
