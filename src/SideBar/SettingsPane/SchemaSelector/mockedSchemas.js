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

const simpleChoiceList = {
  label: 'Simple ChoiceList',
  schema: {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'a_choice_list': {
          'deprecated': false,
          'description': 'A really good description',
          'title': 'a choice list',
          'type': 'array',
          'uniqueItems': true,
          'items': {
            'type': 'string',
            'anyOf': [
              //'$ref': 'https://rfb-era-master-102819134094.us-central1.run.app/schemas/existing/contactrep_patrolactivity.json'
              {
                id: '7f86d95a-9be8-4089-9c4b-36ad9cd5eca5',
                model: 'activity.event',
                field: 'contactrep_patrolactivity',
                value: 'aware',
                display: 'Aware',
                ordernum: 10,
                icon: null,
                is_active: true,
              },
              {
                id: '8766eba2-723a-45f5-848f-531d023922bd',
                model: 'activity.event',
                field: 'contactrep_patrolactivity',
                value: 'unaware',
                display: 'Unaware',
                ordernum: 20,
                icon: null,
                is_active: true,
              },
              {
                id: '07fd81bc-dcaf-43f6-b179-c6ac96f15070',
                model: 'activity.event',
                field: 'contactrep_patrolactivity',
                value: 'ambushed',
                display: 'Ambushed',
                ordernum: 30,
                icon: null,
                is_active: true,
              },
              {
                id: 'eaab9dd4-c278-4df1-9e33-3d3843fc9aea',
                model: 'activity.event',
                field: 'contactrep_patrolactivity',
                value: 'patrolling',
                display: 'Patrolling',
                ordernum: 40,
                icon: null,
                is_active: true,
              },
              {
                id: 'fcece7d8-c7d9-439e-a619-d4c78e06fcac',
                model: 'activity.event',
                field: 'contactrep_patrolactivity',
                value: 'incamp',
                display: 'In Camp',
                ordernum: 50,
                icon: null,
                is_active: true,
              },
              {
                id: '82df38ed-93a3-403a-bda9-3547a51fa519',
                model: 'activity.event',
                field: 'contactrep_patrolactivity',
                value: 'other',
                display: 'Other',
                ordernum: 60,
                icon: null,
                is_active: true,
              },
              //'$ref': 'https://rfb-era-master-102819134094.us-central1.run.app/schemas/existing/spoorrep_type.json'
              {
                id: '3f617359-4804-4f4c-b4a8-da0442a170c2',
                model: 'activity.event',
                field: 'spoorrep_type',
                value: 'footprint',
                display: 'Footprint',
                ordernum: 10,
                icon: null,
                is_active: true,
              },
              {
                id: '7321b7fc-7040-4d0d-be1a-c78f7a74a603',
                model: 'activity.event',
                field: 'spoorrep_type',
                value: 'motorbike',
                display: 'Motorbike',
                ordernum: 20,
                icon: null,
                is_active: true,
              },
              {
                id: 'eb1dbea6-926a-4999-b11f-0dc61e0e05b2',
                model: 'activity.event',
                field: 'spoorrep_type',
                value: 'vehilce',
                display: 'Vehicle',
                ordernum: 30,
                icon: null,
                is_active: true,
              },
            ]
          }
        }
      },
      'required': [
        'a_choice_list'
      ],
      'type': 'object'
    },
    'ui': {
      'fields': {
        'a_choice_list': {
          'choices': {
            'eventTypeCategories': [],
            'existingChoiceList': [
              'contactrep_patrolactivity',
              'spoorrep_type'
            ],
            'featureCategories': [],
            'myDataType': '',
            'subjectGroups': [],
            'subjectSubtypes': [],
            'type': 'EXISTING_CHOICE_LIST'
          },
          'inputType': 'DROPDOWN',
          'placeholder': 'some placeholder',
          'type': 'CHOICE_LIST',
          'parent': 'section-ZAS1G03jWBcxtX9807PP_'
        }
      },
      'headers': {},
      'order': [
        'section-ZAS1G03jWBcxtX9807PP_'
      ],
      'sections': {
        'section-ZAS1G03jWBcxtX9807PP_': {
          'columns': 1,
          'isActive': true,
          'label': '',
          'leftColumn': [
            {
              'name': 'a_choice_list',
              'type': 'field'
            }
          ],
          'rightColumn': []
        }
      }
    }
  }
};

const schemas = [schemaWithTexts, schemaWithSections, schemaWithDateTimes, headerAndSections, simpleChoiceList];

export default schemas;
