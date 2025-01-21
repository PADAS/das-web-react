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

const collections = {
  label: 'Example for collections',
  schema: {
    json: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalProperties: false,
      properties: {
        root_level_text_field: {
          default: '',
          deprecated: false,
          description: '',
          title: 'Root level text field',
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
                description: '',
                title: 'Suspect id',
                type: 'string',
              },
              suspect_name: {
                default: '',
                deprecated: false,
                description: 'Name of the Suspect',
                title: 'Suspect Name',
                type: 'string',
              },
              court_dates: {
                deprecated: false,
                items: {
                  additionalProperties: false,
                  properties: {
                    date: {
                      deprecated: false,
                      description: '',
                      format: 'date',
                      title: 'Date',
                      type: 'string',
                    },
                    witnesses: {
                      deprecated: false,
                      items: {
                        additionalProperties: false,
                        properties: {
                          name: {
                            default: '',
                            deprecated: false,
                            description: '',
                            title: 'Name',
                            type: 'string',
                          },
                        },
                        required: [],
                        type: 'object',
                      },
                      title: 'Witnesses',
                      type: 'array',
                      unevaluatedItems: false,
                    },
                  },
                  required: ['date'],
                  type: 'object',
                },
                title: 'Court Dates',
                type: 'array',
                unevaluatedItems: false,
              },
            },
            required: ['suspect_name'],
            type: 'object',
          },
          maxItems: 5,
          minItems: 2,
          title: 'Suspects',
          type: 'array',
          unevaluatedItems: false,
        },
      },
      required: [],
      type: 'object',
    },
    ui: {
      fields: {
        root_level_text_field: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'section-3FvW-xb785bmSLfTAT1cY',
        },
        suspect_id: {
          inputType: 'SHORT_TEXT',
          placeholder: 'ID',
          type: 'TEXT',
          parent: 'suspects',
        },
        suspect_name: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'suspects',
        },
        date: {
          type: 'DATE_TIME',
          parent: 'court_dates',
        },
        court_dates: {
          buttonText: 'Court Date',
          columns: 2,
          itemIdentifier: 'date',
          itemName: 'Court Date',
          leftColumn: ['date'],
          rightColumn: ['witnesses'],
          type: 'COLLECTION',
          parent: 'suspects',
        },
        name: {
          inputType: 'SHORT_TEXT',
          placeholder: '',
          type: 'TEXT',
          parent: 'witnesses',
        },
        witnesses: {
          buttonText: 'Witness',
          columns: 1,
          itemIdentifier: 'name',
          itemName: 'Witness',
          leftColumn: ['name'],
          rightColumn: [],
          type: 'COLLECTION',
          parent: 'court_dates',
        },
        suspects: {
          buttonText: 'Suspect',
          columns: 2,
          itemIdentifier: 'suspect_name',
          itemName: 'Suspect',
          leftColumn: ['suspect_name', 'court_dates'],
          rightColumn: ['suspect_id'],
          type: 'COLLECTION',
          parent: 'section-3FvW-xb785bmSLfTAT1cY',
        },
      },
      headers: {},
      order: ['section-3FvW-xb785bmSLfTAT1cY'],
      sections: {
        'section-3FvW-xb785bmSLfTAT1cY': {
          columns: 1,
          isActive: true,
          label: '',
          leftColumn: [
            {
              type: 'field',
              name: 'root_level_text_field',
            },
            {
              name: 'suspects',
              type: 'field',
            },
          ],
          rightColumn: [],
        },
      },
    },
  },
};

const schemas = [texts, sections, dateTimes, collections];

export default schemas;
