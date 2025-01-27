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

const choiceLists = {
  label: 'Dropdown choice list',
  schema: {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'this_is_a_required_multi-choice_list': {
          'deprecated': false,
          'description': 'This is a really great description',
          'title': 'This is a required multi-choice list',
          'type': 'array',
          'uniqueItems': true,
          'items': {
            'type': 'string',
            'anyOf': [
              {
                'const': '048fdcef-f599-4205-8b44-1536d46645aa',
                'title': 'DumboAlfonso'
              },
              {
                'const': '0d553bb7-5c4f-43d7-9b82-a561a668ae64',
                'title': 'EarthRanger System'
              },
              {
                'const': '0d9fbeea-5252-4723-ba59-ca696baef2d9',
                'title': 'frank'
              },
              {
                'const': '17e67b22-0e4a-4fcb-aeee-903b51a7a2e0',
                'title': 'Desert Bighorn Sheep'
              },
              {
                'const': '1f32688b-26ea-4648-a995-d5f9bca326e7',
                'title': 'test_alan'
              },
              {
                'const': '200cca41-3303-4b63-a835-4bea40afcc95',
                'title': 'Pronghorn'
              },
              {
                'const': '223ab492-0ea7-4ff2-b8b8-cb6504c943b6',
                'title': 'Ranger Cruz'
              },
              {
                'const': '25567b9a-500f-427c-8a87-59f5e41f858b',
                'title': 'Rabbit'
              },
              {
                'const': '2b7286bf-1734-490b-87c2-ee4206805b47',
                'title': 'ERA-10171'
              },
              {
                'const': '2db50099-8d3b-4f29-ab04-fd42f01d4267',
                'title': 'Ludwig'
              },
              {
                'const': '3492ef65-0519-4b28-9294-a5c55f619696',
                'title': 'Testosteron'
              },
              {
                'const': '35ed3fdd-ba65-4201-9a8a-05775249d534',
                'title': 'alan radio'
              },
              {
                'const': '37906bc2-5323-40d9-8be3-10700af31d26',
                'title': 'Alfonso Hernandez'
              },
              {
                'const': '382860ff-d848-426e-b1f0-43cbfaaf9a12',
                'title': 'GFW Webhook'
              },
              {
                'const': '3b8c7f7d-526e-46a7-8e0d-cf042ab32027',
                'title': 'pw_source'
              },
              {
                'const': '3bc7c8df-3461-47f2-8196-7b0a45405a13',
                'title': 'Subject X'
              }
            ]
          }
        },
        'this_is_a_non_required_single-choice_list': {
          'deprecated': false,
          'description': 'This is a description',
          'title': 'This is a non required single-choice list',
          items: {
            'type': 'string',
            'anyOf': [
              {
                'const': '048fdcef-f599-4205-8b44-1536d46645aa',
                'title': 'DumboAlfonso'
              },
              {
                'const': '0d553bb7-5c4f-43d7-9b82-a561a668ae64',
                'title': 'EarthRanger System'
              },
              {
                'const': '0d9fbeea-5252-4723-ba59-ca696baef2d9',
                'title': 'frank'
              },
              {
                'const': '17e67b22-0e4a-4fcb-aeee-903b51a7a2e0',
                'title': 'Desert Bighorn Sheep'
              },
              {
                'const': '1f32688b-26ea-4648-a995-d5f9bca326e7',
                'title': 'test_alan'
              },
              {
                'const': '200cca41-3303-4b63-a835-4bea40afcc95',
                'title': 'Pronghorn'
              },
              {
                'const': '223ab492-0ea7-4ff2-b8b8-cb6504c943b6',
                'title': 'Ranger Cruz'
              },
              {
                'const': '25567b9a-500f-427c-8a87-59f5e41f858b',
                'title': 'Rabbit'
              },
              {
                'const': '2b7286bf-1734-490b-87c2-ee4206805b47',
                'title': 'ERA-10171'
              },
              {
                'const': '2db50099-8d3b-4f29-ab04-fd42f01d4267',
                'title': 'Ludwig'
              },
              {
                'const': '3492ef65-0519-4b28-9294-a5c55f619696',
                'title': 'Testosteron'
              },
              {
                'const': '35ed3fdd-ba65-4201-9a8a-05775249d534',
                'title': 'alan radio'
              },
              {
                'const': '37906bc2-5323-40d9-8be3-10700af31d26',
                'title': 'Alfonso Hernandez'
              },
              {
                'const': '382860ff-d848-426e-b1f0-43cbfaaf9a12',
                'title': 'GFW Webhook'
              },
              {
                'const': '3b8c7f7d-526e-46a7-8e0d-cf042ab32027',
                'title': 'pw_source'
              },
              {
                'const': '3bc7c8df-3461-47f2-8196-7b0a45405a13',
                'title': 'Subject X'
              }
            ]
          }
        }
      },
      'required': [
        'this_is_a_required_multi-choice_list'
      ],
      'type': 'object'
    },
    'ui': {
      'fields': {
        'this_is_a_required_multi-choice_list': {
          'choices': {
            'eventTypeCategories': [],
            'existingChoiceList': [],
            'featureCategories': [],
            'myDataType': 'SUBJECTS_FROM_SUBJECT_GROUP',
            'subjectGroups': [
              '5bf8761c-0c87-4756-8282-23fa11d72433',
              'ddb99202-1373-4c6c-b15f-e71d21cb2b26'
            ],
            'subjectSubtypes': [],
            'type': 'MY_DATA'
          },
          'inputType': 'DROPDOWN',
          'placeholder': 'This is a hint',
          'type': 'CHOICE_LIST',
          'parent': 'section-mw8HZfvqZ4W0ht40Mxq5S'
        },
        'this_is_a_non_required_single-choice_list': {
          'choices': {
            'eventTypeCategories': [],
            'existingChoiceList': [],
            'featureCategories': [],
            'myDataType': 'SUBJECTS_FROM_SUBJECT_GROUP',
            'subjectGroups': [
              'ddb99202-1373-4c6c-b15f-e71d21cb2b26',
              '5bf8761c-0c87-4756-8282-23fa11d72433'
            ],
            'subjectSubtypes': [],
            'type': 'MY_DATA'
          },
          'inputType': 'DROPDOWN',
          'placeholder': 'A great hint',
          'type': 'CHOICE_LIST',
          'parent': 'section-mw8HZfvqZ4W0ht40Mxq5S'
        }
      },
      'headers': {},
      'order': [
        'section-mw8HZfvqZ4W0ht40Mxq5S'
      ],
      'sections': {
        'section-mw8HZfvqZ4W0ht40Mxq5S': {
          'columns': 1,
          'isActive': true,
          'label': '',
          'leftColumn': [
            {
              'name': 'this_is_a_required_multi-choice_list',
              'type': 'field'
            },
            {
              'name': 'this_is_a_non_required_single-choice_list',
              'type': 'field'
            }
          ],
          'rightColumn': []
        }
      }
    }
  }
};


const schemas = [schemaWithTexts, schemaWithSections, schemaWithDateTimes, headerAndSections, choiceLists];

export default schemas;
