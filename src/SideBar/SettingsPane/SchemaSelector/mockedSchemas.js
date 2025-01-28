const texts = {
  label: 'Example for text fields',
  schema: {
    json: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalProperties: false,
      properties: {
        required_short_text: {
          default: '',
          deprecated: false,
          description: '',
          title: 'Required short text',
          type: 'string',
        },
        required_long_text: {
          default: '',
          deprecated: false,
          description: '',
          title: 'Required long text',
          type: 'string',
        },
        short_text_with_a_hint: {
          default: '',
          deprecated: false,
          description: '',
          title: 'Short text with a hint',
          type: 'string',
        },
        long_text_with_a_hint: {
          default: '',
          deprecated: false,
          description: '',
          title: 'Long text with a hint',
          type: 'string',
        },
        short_text_with_description: {
          default: '',
          deprecated: false,
          description: 'These are some instructions for the data collector',
          title: 'Short text with description',
          type: 'string',
        },
        long_text_with_description: {
          default: '',
          deprecated: false,
          description:
            'These are some instructions for the data collector, these are some instructions for the data collector',
          title: 'Long text with description',
          type: 'string',
        },
      },
      required: ['required_short_text', 'required_long_text'],
      type: 'object',
    },
    ui: {
      fields: {
        required_short_text: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-qTr7if4PZeQ2tOD5HKTfI',
        },
        required_long_text: {
          inputType: 'LONG_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-qTr7if4PZeQ2tOD5HKTfI',
        },
        short_text_with_a_hint: {
          inputType: 'SHORT_TEXT',
          placeholder: 'This is a hint',
          type: 'TEXT',
          parent: 'section-qTr7if4PZeQ2tOD5HKTfI',
        },
        long_text_with_a_hint: {
          inputType: 'SHORT_TEXT',
          placeholder: 'This is an example of data',
          type: 'TEXT',
          parent: 'section-qTr7if4PZeQ2tOD5HKTfI',
        },
        short_text_with_description: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-qTr7if4PZeQ2tOD5HKTfI',
        },
        long_text_with_description: {
          inputType: 'LONG_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-qTr7if4PZeQ2tOD5HKTfI',
        },
      },
      headers: {},
      order: ['section-qTr7if4PZeQ2tOD5HKTfI'],
      sections: {
        'section-qTr7if4PZeQ2tOD5HKTfI': {
          columns: 1,
          isActive: true,
          label: '',
          leftColumn: [
            {
              name: 'required_short_text',
              type: 'field',
            },
            {
              name: 'required_long_text',
              type: 'field',
            },
            {
              name: 'short_text_with_a_hint',
              type: 'field',
            },
            {
              name: 'long_text_with_a_hint',
              type: 'field',
            },
            {
              name: 'short_text_with_description',
              type: 'field',
            },
            {
              name: 'long_text_with_description',
              type: 'field',
            },
          ],
          rightColumn: [],
        },
      },
    },
  },
};

const sections = {
  label: 'Example for sections',
  schema: {
    json: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalProperties: false,
      properties: {
        first_text_field: {
          default: '',
          deprecated: false,
          description: 'Description 1',
          title: 'First text field',
          type: 'string',
        },
        second_text_field: {
          default: 'Default input 2',
          deprecated: false,
          description: 'Description 2',
          title: 'Second text field',
          type: 'string',
        },
        third_text_field: {
          default: '',
          deprecated: false,
          description: '',
          title: 'Third text field',
          type: 'string',
        },
        fourth_text_field: {
          default: '',
          deprecated: true,
          description: '',
          title: 'Fourth text field',
          type: 'string',
        },
        fifth_text_field: {
          default: '',
          deprecated: false,
          description: 'Description 5',
          title: 'Fifth text field',
          type: 'string',
        },
        sixth_text_field: {
          default: '',
          deprecated: true,
          description: '',
          title: 'Sixth text field',
          type: 'string',
        },
      },
      required: ['first_text_field', 'fifth_text_field'],
      type: 'object',
    },
    ui: {
      fields: {
        first_text_field: {
          inputType: 'SHORT_TEXT',
          placeholder: 'Hint 1',
          type: 'TEXT',
          parent: 'section-YkDWwPJ6KjnOvmnh1HEnf',
        },
        second_text_field: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-YkDWwPJ6KjnOvmnh1HEnf',
        },
        third_text_field: {
          inputType: 'SHORT_TEXT',
          placeholder: 'Hint 3',
          type: 'TEXT',
          parent: 'section-YZd_hTxX7T7rCJ04ao9dK',
        },
        fourth_text_field: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-YZd_hTxX7T7rCJ04ao9dK',
        },
        fifth_text_field: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-YZd_hTxX7T7rCJ04ao9dK',
        },
        sixth_text_field: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-4tEZT_sDoOyHV2QGDERl_',
        },
      },
      headers: {},
      order: [
        'section-YkDWwPJ6KjnOvmnh1HEnf',
        'section-YZd_hTxX7T7rCJ04ao9dK',
        'section-4tEZT_sDoOyHV2QGDERl_',
      ],
      sections: {
        'section-YkDWwPJ6KjnOvmnh1HEnf': {
          columns: 1,
          isActive: true,
          label: 'First Section',
          leftColumn: [
            {
              name: 'first_text_field',
              type: 'field',
            },
            {
              name: 'second_text_field',
              type: 'field',
            },
          ],
          rightColumn: [],
        },
        'section-YZd_hTxX7T7rCJ04ao9dK': {
          columns: 2,
          isActive: true,
          label: 'Second Section',
          leftColumn: [
            {
              name: 'third_text_field',
              type: 'field',
            },
          ],
          rightColumn: [
            {
              name: 'fourth_text_field',
              type: 'field',
            },
            {
              name: 'fifth_text_field',
              type: 'field',
            },
          ],
        },
        'section-4tEZT_sDoOyHV2QGDERl_': {
          columns: 1,
          isActive: false,
          label: 'Third Section',
          leftColumn: [
            {
              name: 'sixth_text_field',
              type: 'field',
            },
          ],
          rightColumn: [],
        },
      },
    },
  },
};

const dateTimes = {
  label: 'Example for date-times',
  schema: {
    json: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalProperties: false,
      properties: {
        one_column_date_time_input: {
          deprecated: false,
          description: 'A date-time field inside a single column section. ',
          format: 'date-time',
          title: 'One Column Date Time Input',
          type: 'string',
        },
        one_column_date_input: {
          deprecated: false,
          description: 'A date field inside a single column section.',
          format: 'date',
          title: 'One Column Date Input',
          type: 'string',
        },
        one_column_time_input: {
          deprecated: false,
          description: 'A time field inside a single column section.',
          format: 'time',
          title: 'One Column Time Input',
          type: 'string',
        },
        inactive_date_time_input: {
          deprecated: true,
          description: '',
          format: 'date-time',
          title: 'Inactive Date Time Input',
          type: 'string',
        },
        two_columns_date_time_input: {
          deprecated: false,
          description: '',
          format: 'date-time',
          title: 'Two Columns Date Time Input',
          type: 'string',
        },
        two_columns_date_input: {
          deprecated: false,
          description: '',
          format: 'date',
          title: 'Two Columns Date Input',
          type: 'string',
        },
        two_columns_time_input: {
          deprecated: false,
          description: '',
          format: 'time',
          title: 'Two Columns Time Input',
          type: 'string',
        },
      },
      required: [
        'one_column_date_time_input',
        'two_columns_date_input',
        'two_columns_time_input',
      ],
      type: 'object',
    },
    ui: {
      fields: {
        one_column_date_time_input: {
          type: 'DATE_TIME',
          parent: 'section-JcRPL0uA6I1bV6QgxAXQz',
        },
        one_column_date_input: {
          type: 'DATE_TIME',
          parent: 'section-JcRPL0uA6I1bV6QgxAXQz',
        },
        one_column_time_input: {
          type: 'DATE_TIME',
          parent: 'section-JcRPL0uA6I1bV6QgxAXQz',
        },
        inactive_date_time_input: {
          type: 'DATE_TIME',
          parent: 'section-JcRPL0uA6I1bV6QgxAXQz',
        },
        two_columns_date_time_input: {
          type: 'DATE_TIME',
          parent: 'section-my8sUei31LdKdcS7qIywT',
        },
        two_columns_date_input: {
          type: 'DATE_TIME',
          parent: 'section-my8sUei31LdKdcS7qIywT',
        },
        two_columns_time_input: {
          type: 'DATE_TIME',
          parent: 'section-my8sUei31LdKdcS7qIywT',
        },
      },
      headers: {},
      order: ['section-JcRPL0uA6I1bV6QgxAXQz', 'section-my8sUei31LdKdcS7qIywT'],
      sections: {
        'section-JcRPL0uA6I1bV6QgxAXQz': {
          columns: 1,
          isActive: true,
          label: '',
          leftColumn: [
            {
              name: 'one_column_date_time_input',
              type: 'field',
            },
            {
              name: 'one_column_date_input',
              type: 'field',
            },
            {
              name: 'one_column_time_input',
              type: 'field',
            },
            {
              name: 'inactive_date_time_input',
              type: 'field',
            },
          ],
          rightColumn: [],
        },
        'section-my8sUei31LdKdcS7qIywT': {
          columns: 2,
          isActive: true,
          label: '',
          leftColumn: [
            {
              name: 'two_columns_date_time_input',
              type: 'field',
            },
            {
              name: 'two_columns_date_input',
              type: 'field',
            },
          ],
          rightColumn: [
            {
              name: 'two_columns_time_input',
              type: 'field',
            },
          ],
        },
      },
    },
  },
};

const numerics = {
  label: 'Example for numerics',
  schema: {
    json: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalProperties: false,
      properties: {
        'non_required_numeric_field_with_range_of_1-10': {
          deprecated: false,
          description: 'These are some cool instructions',
          maximum: 20,
          minimum: 10,
          title: 'Non required numeric field with range of 10-20',
          type: 'number',
        },
        required_field_no_range_with_default_input: {
          default: 150,
          deprecated: false,
          description: 'The great detailed description',
          title: 'Required field no range with default input',
          type: 'number',
        },
        an_inactive_numeric_field: {
          deprecated: true,
          description: 'Some really good description',
          title: 'An inactive numeric field',
          type: 'number',
        },
      },
      required: ['required_field_no_range_with_default_input'],
      type: 'object',
    },
    ui: {
      fields: {
        'non_required_numeric_field_with_range_of_1-10': {
          placeholder: 'A placeholder',
          type: 'NUMERIC',
          parent: 'section-mwp2-jUjK6ZxAD9XmIzfX',
        },
        required_field_no_range_with_default_input: {
          placeholder: 'A hint',
          type: 'NUMERIC',
          parent: 'section-mwp2-jUjK6ZxAD9XmIzfX',
        },
        an_inactive_numeric_field: {
          placeholder: 'placeholder',
          type: 'NUMERIC',
          parent: 'section-mwp2-jUjK6ZxAD9XmIzfX',
        },
      },
      headers: {},
      order: ['section-mwp2-jUjK6ZxAD9XmIzfX'],
      sections: {
        'section-mwp2-jUjK6ZxAD9XmIzfX': {
          columns: 1,
          isActive: true,
          label: '',
          leftColumn: [
            {
              name: 'non_required_numeric_field_with_range_of_1-10',
              type: 'field',
            },
            {
              name: 'required_field_no_range_with_default_input',
              type: 'field',
            },
            {
              name: 'an_inactive_numeric_field',
              type: 'field',
            },
          ],
          rightColumn: [],
        },
      },
    },
  },
};

const collections = {
  label: 'Example for collections',
  schema: {
    json: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalProperties: false,
      properties: {
        reason_of_arrest: {
          default: '',
          deprecated: false,
          description: '',
          title: 'Reason of arrest',
          type: 'string',
        },
        informants: {
          deprecated: false,
          items: {
            additionalProperties: false,
            properties: {
              informant_date: {
                deprecated: false,
                description: 'When was the information provided',
                format: 'date',
                title: 'Date',
                type: 'string',
              },
              informant_name: {
                default: '',
                deprecated: false,
                description: '',
                title: 'Name',
                type: 'string',
              },
            },
            required: ['informant_name'],
            type: 'object',
          },
          title: 'Informants',
          type: 'array',
          unevaluatedItems: false,
        },
        extra_information: {
          default: '',
          deprecated: false,
          description: '',
          title: 'Extra information',
          type: 'string',
        },
        suspects: {
          deprecated: false,
          items: {
            additionalProperties: false,
            properties: {
              suspect_id: {
                default: '',
                deprecated: false,
                description: 'Any kind of identification',
                title: 'Id',
                type: 'string',
              },
              suspect_court_date: {
                deprecated: false,
                items: {
                  additionalProperties: false,
                  properties: {
                    suspect_court_date_date: {
                      deprecated: false,
                      description: '',
                      format: 'date-time',
                      title: 'Court Date',
                      type: 'string',
                    },
                    witnesses: {
                      deprecated: false,
                      items: {
                        additionalProperties: false,
                        properties: {
                          suspect_court_date_witness_name: {
                            default: '',
                            deprecated: false,
                            description: '',
                            title: 'Name',
                            type: 'string',
                          },
                        },
                        required: ['suspect_court_date_witness_name'],
                        type: 'object',
                      },
                      title: 'Witnesses',
                      type: 'array',
                      unevaluatedItems: false,
                    },
                  },
                  required: ['suspect_court_date_date'],
                  type: 'object',
                },
                title: 'Court Date',
                type: 'array',
                unevaluatedItems: false,
              },
              suspect_name: {
                default: '',
                deprecated: false,
                description: '',
                title: 'Name',
                type: 'string',
              },
            },
            required: ['suspect_name'],
            type: 'object',
          },
          maxItems: 10,
          minItems: 2,
          title: 'Suspects',
          type: 'array',
          unevaluatedItems: false,
        },
        estimated_number_of_people_involved_with_the_crime: {
          default: '',
          deprecated: false,
          description: 'Number of people involved',
          title: 'Estimated number of people involved with the crime',
          type: 'string',
        },
        inactive_collection: {
          deprecated: true,
          items: {
            additionalProperties: false,
            properties: {
              another_text_field: {
                default: '',
                deprecated: false,
                description: '',
                title: 'Another Text Field',
                type: 'string',
              },
            },
            required: [],
            type: 'object',
          },
          title: 'Inactive collection',
          type: 'array',
          unevaluatedItems: false,
        },
      },
      required: ['estimated_number_of_people_involved_with_the_crime'],
      type: 'object',
    },
    ui: {
      fields: {
        reason_of_arrest: {
          inputType: 'LONG_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-lVgxKRYviEMeJfWNtWz72',
        },
        informants: {
          buttonText: 'Informant',
          columns: 1,
          itemIdentifier: 'informant_name',
          itemName: 'Informant',
          leftColumn: ['informant_name', 'informant_date'],
          rightColumn: [],
          type: 'COLLECTION',
          parent: 'section--Bg8EmlyyR6TODpwxT0bX',
        },
        extra_information: {
          inputType: 'LONG_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-pPpQScPshpxwWztpaxx8i',
        },
        suspects: {
          buttonText: 'Suspect',
          columns: 2,
          itemIdentifier: 'suspect_name',
          itemName: 'Suspect',
          leftColumn: ['suspect_name', 'suspect_court_date'],
          rightColumn: ['suspect_id'],
          type: 'COLLECTION',
          parent: 'section-pPpQScPshpxwWztpaxx8i',
        },
        suspect_id: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'suspects',
        },
        suspect_court_date: {
          buttonText: 'Court Date',
          columns: 2,
          itemIdentifier: 'suspect_court_date_date',
          itemName: 'Court Date',
          leftColumn: ['suspect_court_date_date'],
          rightColumn: ['witnesses'],
          type: 'COLLECTION',
          parent: 'suspects',
        },
        informant_date: {
          type: 'DATE_TIME',
          parent: 'informants',
        },
        suspect_court_date_date: {
          type: 'DATE_TIME',
          parent: 'suspect_court_date',
        },
        suspect_name: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'suspects',
        },
        estimated_number_of_people_involved_with_the_crime: {
          inputType: 'SHORT_TEXT',
          placeholder: '1',
          type: 'TEXT',
          parent: 'section-lVgxKRYviEMeJfWNtWz72',
        },
        informant_name: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'informants',
        },
        witnesses: {
          buttonText: 'Witness',
          columns: 1,
          itemIdentifier: 'suspect_court_date_witness_name',
          itemName: 'Witness',
          leftColumn: ['suspect_court_date_witness_name'],
          rightColumn: [],
          type: 'COLLECTION',
          parent: 'suspect_court_date',
        },
        suspect_court_date_witness_name: {
          inputType: 'SHORT_TEXT',
          placeholder: 'Jane Doe',
          type: 'TEXT',
          parent: 'witnesses',
        },
        another_text_field: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'inactive_collection',
        },
        inactive_collection: {
          buttonText: '',
          columns: 1,
          itemIdentifier: 'another_text_field',
          itemName: 'Inactive',
          leftColumn: ['another_text_field'],
          rightColumn: [],
          type: 'COLLECTION',
          parent: 'section-lVgxKRYviEMeJfWNtWz72',
        }
      },
      headers: {},
      order: [
        'section-lVgxKRYviEMeJfWNtWz72',
        'section--Bg8EmlyyR6TODpwxT0bX',
        'section-pPpQScPshpxwWztpaxx8i',
      ],
      sections: {
        'section-lVgxKRYviEMeJfWNtWz72': {
          columns: 2,
          isActive: true,
          label: '',
          leftColumn: [
            {
              name: 'reason_of_arrest',
              type: 'field',
            },
            {
              name: 'inactive_collection',
              type: 'field',
            },
          ],
          rightColumn: [
            {
              name: 'estimated_number_of_people_involved_with_the_crime',
              type: 'field',
            },
          ],
        },
        'section--Bg8EmlyyR6TODpwxT0bX': {
          columns: 1,
          isActive: true,
          label: 'Arrest Intel',
          leftColumn: [
            {
              name: 'informants',
              type: 'field',
            },
          ],
          rightColumn: [],
        },
        'section-pPpQScPshpxwWztpaxx8i': {
          columns: 2,
          isActive: true,
          label: 'Suspects',
          leftColumn: [
            {
              name: 'suspects',
              type: 'field',
            },
          ],
          rightColumn: [
            {
              name: 'extra_information',
              type: 'field',
            },
          ],
        },
      },
    },
  },
};

const headers = {
  label: 'Example for headers',
  schema: {
    json: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalProperties: false,
      properties: {
        a_field: {
          default: '',
          deprecated: false,
          description: '',
          title: 'a field',
          type: 'string',
        },
        text_field: {
          default: '',
          deprecated: false,
          description: '',
          title: 'text field',
          type: 'string',
        },
        some_data: {
          default: '',
          deprecated: false,
          description: '',
          title: 'Some data',
          type: 'string',
        },
        other_stuff: {
          default: '',
          deprecated: false,
          description: '',
          title: 'other stuff',
          type: 'string',
        },
      },
      required: [],
      type: 'object',
    },
    ui: {
      fields: {
        a_field: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-DrHl1yQyzRraCzm-V276C',
        },
        text_field: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-DrHl1yQyzRraCzm-V276C',
        },
        some_data: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-GzhQrd4U8_4Y-Z0QgDNze',
        },
        other_stuff: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-GzhQrd4U8_4Y-Z0QgDNze',
        },
      },
      headers: {
        'header-OYa0RpQenymtu66pnTLmc': {
          label: 'This is a medium header: just for validation purposes',
          section: 'section-DrHl1yQyzRraCzm-V276C',
          size: 'MEDIUM',
        },
        'header-fKIQXwpSEDHqsPP71kT0F': {
          label: 'This a large header: just for validation purposes',
          section: 'section-DrHl1yQyzRraCzm-V276C',
          size: 'LARGE',
        },
        'header--MGpFINYNGajDlzQbdOKg': {
          label: 'This is a medium header: just for validation purposes',
          section: 'section-GzhQrd4U8_4Y-Z0QgDNze',
          size: 'MEDIUM',
        },
        'header-rqLceS3fjpeGkW2URQh75': {
          label: 'This is a medium small: just for validation purposes',
          section: 'section-GzhQrd4U8_4Y-Z0QgDNze',
          size: 'SMALL',
        },
      },
      order: ['section-DrHl1yQyzRraCzm-V276C', 'section-GzhQrd4U8_4Y-Z0QgDNze'],
      sections: {
        'section-GzhQrd4U8_4Y-Z0QgDNze': {
          columns: 2,
          isActive: true,
          label: 'Medium and small headers',
          leftColumn: [
            {
              name: 'header--MGpFINYNGajDlzQbdOKg',
              type: 'header',
            },
            {
              name: 'some_data',
              type: 'field',
            },
          ],
          rightColumn: [
            {
              name: 'header-rqLceS3fjpeGkW2URQh75',
              type: 'header',
            },
            {
              name: 'other_stuff',
              type: 'field',
            },
          ],
        },
        'section-DrHl1yQyzRraCzm-V276C': {
          columns: 2,
          isActive: true,
          label: 'Large and Medium headers',
          leftColumn: [
            {
              name: 'header-fKIQXwpSEDHqsPP71kT0F',
              type: 'header',
            },
            {
              name: 'text_field',
              type: 'field',
            },
          ],
          rightColumn: [
            {
              type: 'header',
              name: 'header-OYa0RpQenymtu66pnTLmc',
            },
            {
              name: 'a_field',
              type: 'field',
            },
          ],
        },
      },
    },
  },
};

export const choicesOptions = [
  {
    const: '048fdcef-f599-4205-8b44-1536d46645aa',
    title: 'DumboAlfonso'
  },
  {
    const: '0d553bb7-5c4f-43d7-9b82-a561a668ae64',
    title: 'EarthRanger System'
  },
  {
    const: '0d9fbeea-5252-4723-ba59-ca696baef2d9',
    title: 'frank'
  },
  {
    const: '17e67b22-0e4a-4fcb-aeee-903b51a7a2e0',
    title: 'Desert Bighorn Sheep'
  },
  {
    const: '1f32688b-26ea-4648-a995-d5f9bca326e7',
    title: 'test_alan'
  },
  {
    const: '200cca41-3303-4b63-a835-4bea40afcc95',
    title: 'Pronghorn'
  },
  {
    const: '223ab492-0ea7-4ff2-b8b8-cb6504c943b6',
    title: 'Ranger Cruz'
  },
  {
    const: '25567b9a-500f-427c-8a87-59f5e41f858b',
    title: 'Rabbit'
  },
  {
    const: '2b7286bf-1734-490b-87c2-ee4206805b47',
    title: 'ERA-10171'
  },
  {
    const: '2db50099-8d3b-4f29-ab04-fd42f01d4267',
    title: 'Ludwig'
  },
  {
    const: '3492ef65-0519-4b28-9294-a5c55f619696',
    title: 'Testosteron'
  },
  {
    const: '35ed3fdd-ba65-4201-9a8a-05775249d534',
    title: 'alan radio'
  },
  {
    const: '37906bc2-5323-40d9-8be3-10700af31d26',
    title: 'Alfonso Hernandez'
  },
  {
    const: '382860ff-d848-426e-b1f0-43cbfaaf9a12',
    title: 'GFW Webhook'
  },
  {
    const: '3b8c7f7d-526e-46a7-8e0d-cf042ab32027',
    title: 'pw_source'
  },
  {
    const: '3bc7c8df-3461-47f2-8196-7b0a45405a13',
    title: 'Subject X'
  }
];


const choiceLists = {
  label: 'Example for choice list',
  schema: {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'required_multi-option': {
          'deprecated': false,
          'description': 'This is a description',
          'title': 'Required multi-option',
          'type': 'array',
          'uniqueItems': true,
          'items': {
            'type': 'string',
            'anyOf': [
              {
                oneOf: choicesOptions
              }
            ]
          }
        },
        'optional_single_choice': {
          'deprecated': false,
          'description': 'This a detailed description',
          'title': 'Optional single choice',
          'type': 'string',
          'anyOf': [
            {
              oneOf: choicesOptions
            }
          ]
        },
        'a_collection_of_data': {
          'deprecated': false,
          'items': {
            'additionalProperties': false,
            'properties': {
              'single_option': {
                'deprecated': false,
                'description': 'This is a description',
                'title': 'Single option',
                'type': 'string',
                'anyOf': [
                  {
                    oneOf: choicesOptions
                  }
                ]
              },
              'extra_info': {
                'deprecated': false,
                'items': {
                  'additionalProperties': false,
                  'properties': {
                    'multiple_option': {
                      'deprecated': false,
                      'description': 'This is a description',
                      'title': 'Multiple option',
                      'type': 'array',
                      'uniqueItems': true,
                      'items': {
                        'type': 'string',
                        'anyOf': [
                          {
                            oneOf: choicesOptions
                          }
                        ]
                      }
                    },
                    'record_name': {
                      'default': '',
                      'deprecated': false,
                      'description': '',
                      'title': 'Record name',
                      'type': 'string'
                    }
                  },
                  'required': [
                    'multiple_option'
                  ],
                  'type': 'object'
                },
                'title': 'Extra info',
                'type': 'array',
                'unevaluatedItems': false
              }
            },
            'required': [
              'single_option'
            ],
            'type': 'object'
          },
          'title': 'A collection of data',
          'type': 'array',
          'unevaluatedItems': false
        },
        'optional_numeric_stuff': {
          'deprecated': false,
          'description': '',
          'title': 'Optional numeric stuff',
          'type': 'number'
        }
      },
      'required': [
        'required_multi-option'
      ],
      'type': 'object'
    },
    'ui': {
      'fields': {
        'required_multi-option': {
          'choices': {
            'eventTypeCategories': [],
            'existingChoiceList': [],
            'featureCategories': [],
            'myDataType': 'SUBJECTS_FROM_SUBJECT_GROUP',
            'subjectGroups': [
              '5bf8761c-0c87-4756-8282-23fa11d72433'
            ],
            'subjectSubtypes': [],
            'type': 'MY_DATA'
          },
          'inputType': 'DROPDOWN',
          'placeholder': 'This is a placeholder',
          'type': 'CHOICE_LIST',
          'parent': 'section-75Vs8Xv8lrjuUoZuIaTN2'
        },
        'optional_single_choice': {
          'choices': {
            'eventTypeCategories': [],
            'existingChoiceList': [
              'contactrep_whoinitiatedcontact'
            ],
            'featureCategories': [],
            'myDataType': '',
            'subjectGroups': [],
            'subjectSubtypes': [],
            'type': 'EXISTING_CHOICE_LIST'
          },
          'inputType': 'DROPDOWN',
          'placeholder': 'This is a hint',
          'type': 'CHOICE_LIST',
          'parent': 'section-75Vs8Xv8lrjuUoZuIaTN2'
        },
        'a_collection_of_data': {
          'buttonText': 'add more',
          'columns': 1,
          'itemIdentifier': '',
          'itemName': 'people',
          'leftColumn': [
            'single_option',
            'extra_info'
          ],
          'rightColumn': [],
          'type': 'COLLECTION',
          'parent': 'section-75Vs8Xv8lrjuUoZuIaTN2'
        },
        'single_option': {
          'choices': {
            'eventTypeCategories': [],
            'existingChoiceList': [],
            'featureCategories': [],
            'myDataType': 'SUBJECTS_FROM_SUBJECT_GROUP',
            'subjectGroups': [
              '5bf8761c-0c87-4756-8282-23fa11d72433'
            ],
            'subjectSubtypes': [],
            'type': 'MY_DATA'
          },
          'inputType': 'DROPDOWN',
          'placeholder': 'This is a hint',
          'type': 'CHOICE_LIST',
          'parent': 'a_collection_of_data'
        },
        'extra_info': {
          'buttonText': 'add record',
          'columns': 1,
          'itemIdentifier': '',
          'itemName': 'record',
          'leftColumn': [
            'multiple_option',
            'record_name'
          ],
          'rightColumn': [],
          'type': 'COLLECTION',
          'parent': 'a_collection_of_data'
        },
        'multiple_option': {
          'choices': {
            'eventTypeCategories': [],
            'existingChoiceList': [],
            'featureCategories': [],
            'myDataType': 'SUBJECTS_FROM_SUBJECT_SUBTYPE',
            'subjectGroups': [],
            'subjectSubtypes': [
              'bighorn_sheep_desert',
              'pronghorn'
            ],
            'type': 'MY_DATA'
          },
          'inputType': 'DROPDOWN',
          'placeholder': 'This is a hint',
          'type': 'CHOICE_LIST',
          'parent': 'extra_info'
        },
        'record_name': {
          'inputType': 'SHORT_TEXT',
          'placeholder': 'Record example',
          'type': 'TEXT',
          'parent': 'extra_info'
        },
        'optional_numeric_stuff': {
          'placeholder': 'Some numeric data example',
          'type': 'NUMERIC',
          'parent': 'section-75Vs8Xv8lrjuUoZuIaTN2'
        }
      },
      'headers': {},
      'order': [
        'section-75Vs8Xv8lrjuUoZuIaTN2'
      ],
      'sections': {
        'section-75Vs8Xv8lrjuUoZuIaTN2': {
          'columns': 1,
          'isActive': true,
          'label': '',
          'leftColumn': [
            {
              'name': 'required_multi-option',
              'type': 'field'
            },
            {
              'name': 'optional_single_choice',
              'type': 'field'
            },
            {
              'name': 'optional_numeric_stuff',
              'type': 'field'
            },
            {
              'name': 'a_collection_of_data',
              'type': 'field'
            }
          ],
          'rightColumn': []
        }
      }
    }
  }
};

const schemas = [texts, sections, dateTimes, headers, numerics, choiceLists, collections];

export default schemas;
