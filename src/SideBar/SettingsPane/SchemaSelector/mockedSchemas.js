const schemaWithBasicText = {
  label: 'Long and short text configs',
  schema: {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'required_short_text': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': 'Required short text',
          'type': 'string'
        },
        'required_long_text': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': 'Required long text',
          'type': 'string'
        },
        'short_text_with_a_hint': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': 'Short text with a hint',
          'type': 'string'
        },
        'long_text_with_a_hint': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': 'Long text with a hint',
          'type': 'string'
        },
        'short_text_with_description': {
          'default': '',
          'deprecated': false,
          'description': 'These are some instructions for the data collector',
          'title': 'Short text with description',
          'type': 'string'
        },
        'long_text_with_description': {
          'default': '',
          'deprecated': false,
          'description': 'These are some instructions for the data collector, these are some instructions for the data collector',
          'title': 'Long text with description',
          'type': 'string'
        }
      },
      'required': [
        'required_short_text',
        'required_long_text'
      ],
      'type': 'object'
    },
    'ui': {
      'fields': {
        'required_short_text': {
          'inputType': 'SHORT_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-qTr7if4PZeQ2tOD5HKTfI'
        },
        'required_long_text': {
          'inputType': 'LONG_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-qTr7if4PZeQ2tOD5HKTfI'
        },
        'short_text_with_a_hint': {
          'inputType': 'SHORT_TEXT',
          'placeholder': 'This is a hint',
          'type': 'TEXT',
          'parent': 'section-qTr7if4PZeQ2tOD5HKTfI'
        },
        'long_text_with_a_hint': {
          'inputType': 'SHORT_TEXT',
          'placeholder': 'This is an example of data',
          'type': 'TEXT',
          'parent': 'section-qTr7if4PZeQ2tOD5HKTfI'
        },
        'short_text_with_description': {
          'inputType': 'SHORT_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-qTr7if4PZeQ2tOD5HKTfI'
        },
        'long_text_with_description': {
          'inputType': 'LONG_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-qTr7if4PZeQ2tOD5HKTfI'
        }
      },
      'headers': {},
      'order': [
        'section-qTr7if4PZeQ2tOD5HKTfI'
      ],
      'sections': {
        'section-qTr7if4PZeQ2tOD5HKTfI': {
          'columns': 1,
          'isActive': true,
          'label': '',
          'leftColumn': [
            {
              'name': 'required_short_text',
              'type': 'field'
            },
            {
              'name': 'required_long_text',
              'type': 'field'
            },
            {
              'name': 'short_text_with_a_hint',
              'type': 'field'
            },
            {
              'name': 'long_text_with_a_hint',
              'type': 'field'
            },
            {
              'name': 'short_text_with_description',
              'type': 'field'
            },
            {
              'name': 'long_text_with_description',
              'type': 'field'
            }
          ],
          'rightColumn': []
        }
      }
    }
  }
};

const schemaWithTexts = {
  label: 'Text fields with full settings',
  schema: {
    json: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      additionalProperties: false,
      properties: {
        long_text_with_full_settings: {
          default: 'a default input',
          deprecated: false,
          description: 'These are some instructions for the data collector',
          title: 'Long text with full settings',
          type: 'string',
        },
        short_text_with_full_settings: {
          default: 'a default input',
          deprecated: false,
          description: 'These are some instructions for the data collector',
          title: 'Short text with full settings',
          type: 'string',
        },
      },
      required: [
        'long_text_with_full_settings',
        'short_text_with_full_settings',
      ],
      type: 'object',
    },
    ui: {
      fields: {
        long_text_with_full_settings: {
          inputType: 'LONG_TEXT',
          placeholder: 'This is an example!',
          type: 'TEXT',
          parent: 'section-fD44j61je2TaHktLTPwrU',
        },
        short_text_with_full_settings: {
          inputType: 'SHORT_TEXT',
          placeholder: 'This is a hint',
          type: 'TEXT',
          parent: 'section-fD44j61je2TaHktLTPwrU',
        },
      },
      headers: {},
      order: ['section-fD44j61je2TaHktLTPwrU'],
      sections: {
        'section-fD44j61je2TaHktLTPwrU': {
          columns: 1,
          isActive: true,
          label: '',
          leftColumn: [
            {
              name: 'short_text_with_full_settings',
              type: 'field',
            },
            {
              name: 'long_text_with_full_settings',
              type: 'field',
            },
          ],
          rightColumn: [],
        },
      },
    },
  },
};

const schemaWithSections = {
  label: 'Sections',
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

const schemaWithDateTimes = {
  label: 'Date Times',
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

const headers = {
  label: 'Simple headers',
  schema: {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'text-aBDY50baUvOiMyw0fNXU5': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': '',
          'type': 'string'
        },
        'date_time-FzW1yB0pPa4QIhbpckaRi': {
          'deprecated': false,
          'description': '',
          'format': 'date-time',
          'title': '',
          'type': 'string'
        },
        'text-aR951nn9CnCaw9T00rDZj': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': '',
          'type': 'string'
        }
      },
      'required': [],
      'type': 'object'
    },
    'ui': {
      'fields': {
        'text-aBDY50baUvOiMyw0fNXU5': {
          'inputType': 'SHORT_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-GzqNlGGzSe4TOZTYnUvpA'
        },
        'date_time-FzW1yB0pPa4QIhbpckaRi': {
          'type': 'DATE_TIME',
          'parent': 'section-GzqNlGGzSe4TOZTYnUvpA'
        },
        'text-aR951nn9CnCaw9T00rDZj': {
          'inputType': 'SHORT_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-GzqNlGGzSe4TOZTYnUvpA'
        }
      },
      'headers': {
        'header-OVarYS-eY1i5bgsFCbvYy': {
          'label': 'Large Header',
          'section': 'section-GzqNlGGzSe4TOZTYnUvpA',
          'size': 'LARGE'
        },
        'header-KpCMq_yHg4ZsI3mRAnPxE': {
          'label': 'Medium header',
          'section': 'section-GzqNlGGzSe4TOZTYnUvpA',
          'size': 'MEDIUM'
        },
        'header-yvSXeaiZN8mRUzMLjx2qC': {
          'label': 'Small header',
          'section': 'section-GzqNlGGzSe4TOZTYnUvpA',
          'size': 'SMALL'
        }
      },
      'order': [
        'section-GzqNlGGzSe4TOZTYnUvpA'
      ],
      'sections': {
        'section-GzqNlGGzSe4TOZTYnUvpA': {
          'columns': 1,
          'isActive': true,
          'label': '',
          'leftColumn': [
            {
              'name': 'header-OVarYS-eY1i5bgsFCbvYy',
              'type': 'header'
            },
            {
              'name': 'text-aBDY50baUvOiMyw0fNXU5',
              'type': 'field'
            },
            {
              'name': 'header-KpCMq_yHg4ZsI3mRAnPxE',
              'type': 'header'
            },
            {
              'name': 'date_time-FzW1yB0pPa4QIhbpckaRi',
              'type': 'field'
            },
            {
              'name': 'header-yvSXeaiZN8mRUzMLjx2qC',
              'type': 'header'
            },
            {
              'name': 'text-aR951nn9CnCaw9T00rDZj',
              'type': 'field'
            }
          ],
          'rightColumn': []
        }
      }
    }
  }
};

const headersWithFields = {
  label: 'Headers with fields',
  schema: {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'date_time-FzW1yB0pPa4QIhbpckaRi': {
          'deprecated': false,
          'description': '',
          'format': 'date-time',
          'title': '',
          'type': 'string'
        },
        'text-aR951nn9CnCaw9T00rDZj': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': '',
          'type': 'string'
        },
        'a_text_field': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': 'a text field',
          'type': 'string'
        }
      },
      'required': [],
      'type': 'object'
    },
    'ui': {
      'fields': {
        'date_time-FzW1yB0pPa4QIhbpckaRi': {
          'type': 'DATE_TIME',
          'parent': 'section-GzqNlGGzSe4TOZTYnUvpA'
        },
        'text-aR951nn9CnCaw9T00rDZj': {
          'inputType': 'SHORT_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-GzqNlGGzSe4TOZTYnUvpA'
        },
        'a_text_field': {
          'inputType': 'SHORT_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-GzqNlGGzSe4TOZTYnUvpA'
        }
      },
      'headers': {
        'header-OVarYS-eY1i5bgsFCbvYy': {
          'label': 'This is a large header',
          'section': 'section-GzqNlGGzSe4TOZTYnUvpA',
          'size': 'LARGE'
        },
        'header-KpCMq_yHg4ZsI3mRAnPxE': {
          'label': 'Medium header: some other explanation',
          'section': 'section-GzqNlGGzSe4TOZTYnUvpA',
          'size': 'MEDIUM'
        },
        'header-yvSXeaiZN8mRUzMLjx2qC': {
          'label': 'Small header with little instructions',
          'section': 'section-GzqNlGGzSe4TOZTYnUvpA',
          'size': 'SMALL'
        }
      },
      'order': [
        'section-GzqNlGGzSe4TOZTYnUvpA'
      ],
      'sections': {
        'section-GzqNlGGzSe4TOZTYnUvpA': {
          'columns': 1,
          'isActive': true,
          'label': '',
          'leftColumn': [
            {
              'name': 'header-OVarYS-eY1i5bgsFCbvYy',
              'type': 'header'
            },
            {
              'name': 'a_text_field',
              'type': 'field'
            },
            {
              'name': 'header-KpCMq_yHg4ZsI3mRAnPxE',
              'type': 'header'
            },
            {
              'name': 'date_time-FzW1yB0pPa4QIhbpckaRi',
              'type': 'field'
            },
            {
              'name': 'header-yvSXeaiZN8mRUzMLjx2qC',
              'type': 'header'
            },
            {
              'name': 'text-aR951nn9CnCaw9T00rDZj',
              'type': 'field'
            }
          ],
          'rightColumn': []
        }
      }
    }
  }
};

const stackedHeaders = {
  label: 'Combine headers sizes with fields',
  schema: {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'date_time-FzW1yB0pPa4QIhbpckaRi': {
          'deprecated': false,
          'description': '',
          'format': 'date-time',
          'title': '',
          'type': 'string'
        },
        'a_text_field': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': 'a text field',
          'type': 'string'
        }
      },
      'required': [],
      'type': 'object'
    },
    'ui': {
      'fields': {
        'date_time-FzW1yB0pPa4QIhbpckaRi': {
          'type': 'DATE_TIME',
          'parent': 'section-GzqNlGGzSe4TOZTYnUvpA'
        },
        'a_text_field': {
          'inputType': 'SHORT_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-GzqNlGGzSe4TOZTYnUvpA'
        }
      },
      'headers': {
        'header-OVarYS-eY1i5bgsFCbvYy': {
          'label': 'This is a large header',
          'section': 'section-GzqNlGGzSe4TOZTYnUvpA',
          'size': 'LARGE'
        },
        'header-KpCMq_yHg4ZsI3mRAnPxE': {
          'label': 'Medium header used a second set of instructions for data collectors',
          'section': 'section-GzqNlGGzSe4TOZTYnUvpA',
          'size': 'MEDIUM'
        },
        'header-yvSXeaiZN8mRUzMLjx2qC': {
          'label': 'Small header: maybe this one could be used for more field-specific instructions',
          'section': 'section-GzqNlGGzSe4TOZTYnUvpA',
          'size': 'SMALL'
        }
      },
      'order': [
        'section-GzqNlGGzSe4TOZTYnUvpA'
      ],
      'sections': {
        'section-GzqNlGGzSe4TOZTYnUvpA': {
          'columns': 1,
          'isActive': true,
          'label': '',
          'leftColumn': [
            {
              'name': 'header-OVarYS-eY1i5bgsFCbvYy',
              'type': 'header'
            },
            {
              'name': 'header-KpCMq_yHg4ZsI3mRAnPxE',
              'type': 'header'
            },
            {
              'name': 'a_text_field',
              'type': 'field'
            },
            {
              'name': 'header-yvSXeaiZN8mRUzMLjx2qC',
              'type': 'header'
            },
            {
              'name': 'date_time-FzW1yB0pPa4QIhbpckaRi',
              'type': 'field'
            }
          ],
          'rightColumn': []
        }
      }
    }
  }
};

const largeContentHeaders = {
  label: 'Large content headers',
  schema: {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'a_text_field': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': 'a text field',
          'type': 'string'
        },
        'a_date': {
          'deprecated': false,
          'description': '',
          'format': 'date-time',
          'title': 'A date',
          'type': 'string'
        },
        'a_field': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': 'A field',
          'type': 'string'
        }
      },
      'required': [],
      'type': 'object'
    },
    'ui': {
      'fields': {
        'a_text_field': {
          'inputType': 'SHORT_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-GzqNlGGzSe4TOZTYnUvpA'
        },
        'a_date': {
          'type': 'DATE_TIME',
          'parent': 'section-GzqNlGGzSe4TOZTYnUvpA'
        },
        'a_field': {
          'inputType': 'SHORT_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-GzqNlGGzSe4TOZTYnUvpA'
        }
      },
      'headers': {
        'header-OVarYS-eY1i5bgsFCbvYy': {
          'label': 'Large Header: Movies ipsum I don’t know, and I would rather not guess. Your time will come. You will face the same Evil, and you will defeat it. Do you remember the taste of strawberries? Home is behind, the world ahead, and there are many paths to tread through shadows to the edge of night, until the stars are all alight. Let him not vow to walk in the dark, who has not seen the nightfall. It came to me. It’s mine, my own, my love, my precious. Not all those who wander are lost.',
          'section': 'section-GzqNlGGzSe4TOZTYnUvpA',
          'size': 'LARGE'
        },
        'header-KpCMq_yHg4ZsI3mRAnPxE': {
          'label': 'Medium Header: Gandalf, my old friend, this will be a night to remember. It is a strange fate that we should suffer so much fear and doubt over so small a thing, such a little thing. Books ought to have good endings. How would this do? ‘And they all settled down and lived together happily ever after.\' If more of us valued food and cheer and song above hoarded gold, it would be a merrier world. And to that, I hold. I would rather share one lifetime with you than face all the ages of this world alone. Home is behind, the world ahead, and there are many paths to tread through shadows to the edge of night, until the stars are all alight. But do not despise the lore that has come down from distant years; for oft, it may chance that old wives keep in memory word of things that once were needful for the wise to know. Death is just another path, one that we all must take.',
          'section': 'section-GzqNlGGzSe4TOZTYnUvpA',
          'size': 'MEDIUM'
        },
        'header-yvSXeaiZN8mRUzMLjx2qC': {
          'label': 'Small Header: I thought up an ending for my book: ‘And he lived happily ever after, unto the end of his days.\' That’s no moon. It’s a space station. Books ought to have good endings. How would this do? ‘And they all settled down and lived together happily ever after.\' Snow’s all right on a fine morning, but I like to be in bed when it’s falling. It’s like in the great stories, my Frodo. The ones that really mattered… and sometimes you didn’t want to know the end, because how could the end be happy? But, in the end, it’s only a passing thing, this shadow. Even darkness must pass. I’m coming, Mr. Frodo. There’s some good in this world, Mr. Frodo… and it’s worth fighting for. It came to me. It’s mine, my own, my love, my precious.\n\nDo you remember the taste of strawberries? When in doubt, follow your nose. I can’t carry it for you, but I can carry you. You step into the Road, and if you don’t keep your feet, there is no knowing where you might be swept off to. I don’t know, and I would rather not guess. When in doubt, follow your nose. You step into the Road, and if you don’t keep your feet, there is no knowing where you might be swept off to. When you look at the dark side, careful you must be… for the dark side looks back.',
          'section': 'section-GzqNlGGzSe4TOZTYnUvpA',
          'size': 'SMALL'
        }
      },
      'order': [
        'section-GzqNlGGzSe4TOZTYnUvpA'
      ],
      'sections': {
        'section-GzqNlGGzSe4TOZTYnUvpA': {
          'columns': 1,
          'isActive': true,
          'label': '',
          'leftColumn': [
            {
              'name': 'header-OVarYS-eY1i5bgsFCbvYy',
              'type': 'header'
            },
            {
              'name': 'a_text_field',
              'type': 'field'
            },
            {
              'name': 'header-KpCMq_yHg4ZsI3mRAnPxE',
              'type': 'header'
            },
            {
              'name': 'a_date',
              'type': 'field'
            },
            {
              'name': 'header-yvSXeaiZN8mRUzMLjx2qC',
              'type': 'header'
            },
            {
              'name': 'a_field',
              'type': 'field'
            }
          ],
          'rightColumn': []
        }
      }
    }
  }
};


const headerAndSections = {
  label: 'Headers and Sections',
  schema: {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'a_field': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': 'a field',
          'type': 'string'
        },
        'text_field': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': 'text field',
          'type': 'string'
        },
        'some_data': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': 'Some data',
          'type': 'string'
        },
        'other_stuff': {
          'default': '',
          'deprecated': false,
          'description': '',
          'title': 'other stuff',
          'type': 'string'
        }
      },
      'required': [],
      'type': 'object'
    },
    'ui': {
      'fields': {
        'a_field': {
          'inputType': 'SHORT_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-DrHl1yQyzRraCzm-V276C'
        },
        'text_field': {
          'inputType': 'SHORT_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-DrHl1yQyzRraCzm-V276C'
        },
        'some_data': {
          'inputType': 'SHORT_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-GzhQrd4U8_4Y-Z0QgDNze'
        },
        'other_stuff': {
          'inputType': 'SHORT_TEXT',
          'placeholder': '',
          'type': 'TEXT',
          'parent': 'section-GzhQrd4U8_4Y-Z0QgDNze'
        }
      },
      'headers': {
        'header-OYa0RpQenymtu66pnTLmc': {
          'label': 'This is a medium header: just for validation purposes',
          'section': 'section-DrHl1yQyzRraCzm-V276C',
          'size': 'MEDIUM'
        },
        'header-fKIQXwpSEDHqsPP71kT0F': {
          'label': 'This a large header: just for validation purposes',
          'section': 'section-DrHl1yQyzRraCzm-V276C',
          'size': 'LARGE'
        },
        'header--MGpFINYNGajDlzQbdOKg': {
          'label': 'This is a medium header: just for validation purposes',
          'section': 'section-GzhQrd4U8_4Y-Z0QgDNze',
          'size': 'MEDIUM'
        },
        'header-rqLceS3fjpeGkW2URQh75': {
          'label': 'This is a medium small: just for validation purposes',
          'section': 'section-GzhQrd4U8_4Y-Z0QgDNze',
          'size': 'SMALL'
        }
      },
      'order': [
        'section-DrHl1yQyzRraCzm-V276C',
        'section-GzhQrd4U8_4Y-Z0QgDNze'
      ],
      'sections': {
        'section-GzhQrd4U8_4Y-Z0QgDNze': {
          'columns': 2,
          'isActive': true,
          'label': 'Medium and small headers',
          'leftColumn': [
            {
              'name': 'header--MGpFINYNGajDlzQbdOKg',
              'type': 'header'
            },
            {
              'name': 'some_data',
              'type': 'field'
            }
          ],
          'rightColumn': [
            {
              'name': 'header-rqLceS3fjpeGkW2URQh75',
              'type': 'header'
            },
            {
              'name': 'other_stuff',
              'type': 'field'
            }
          ]
        },
        'section-DrHl1yQyzRraCzm-V276C': {
          'columns': 2,
          'isActive': true,
          'label': 'Large and Medium headers',
          'leftColumn': [
            {
              'name': 'header-fKIQXwpSEDHqsPP71kT0F',
              'type': 'header'
            },
            {
              'name': 'text_field',
              'type': 'field'
            }
          ],
          'rightColumn': [
            {
              'type': 'header',
              'name': 'header-OYa0RpQenymtu66pnTLmc'
            },
            {
              'name': 'a_field',
              'type': 'field'
            }
          ]
        }
      }
    }
  }
};


const schemas = [schemaWithTexts, schemaWithSections, schemaWithBasicText, schemaWithDateTimes, headers, headersWithFields, stackedHeaders, largeContentHeaders, headerAndSections];

export default schemas;
