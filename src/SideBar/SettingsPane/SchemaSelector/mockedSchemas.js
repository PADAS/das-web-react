const schemaWithTexts = {
  label: 'Text fields with full settings',
  schema: {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'long_text_with_full_settings': {
          'default': 'a default input',
          'deprecated': false,
          'description': 'These are some instructions for the data collector',
          'title': 'Long text with full settings',
          'type': 'string'
        },
        'short_text_with_full_settings': {
          'default': 'a default input',
          'deprecated': false,
          'description': 'These are some instructions for the data collector',
          'title': 'Short text with full settings',
          'type': 'string'
        }
      },
      'required': [
        'long_text_with_full_settings',
        'short_text_with_full_settings'
      ],
      'type': 'object'
    },
    'ui': {
      'fields': {
        'long_text_with_full_settings': {
          'inputType': 'LONG_TEXT',
          'placeholder': 'This is an example!',
          'type': 'TEXT',
          'parent': 'section-fD44j61je2TaHktLTPwrU'
        },
        'short_text_with_full_settings': {
          'inputType': 'SHORT_TEXT',
          'placeholder': 'This is a hint',
          'type': 'TEXT',
          'parent': 'section-fD44j61je2TaHktLTPwrU'
        }
      },
      'headers': {},
      'order': [
        'section-fD44j61je2TaHktLTPwrU'
      ],
      'sections': {
        'section-fD44j61je2TaHktLTPwrU': {
          'columns': 1,
          'isActive': true,
          'label': '',
          'leftColumn': [
            {
              'name': 'short_text_with_full_settings',
              'type': 'field'
            },
            {
              'name': 'long_text_with_full_settings',
              'type': 'field'
            }
          ],
          'rightColumn': []
        }
      }
    }
  }
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

const schemas = [schemaWithTexts, schemaWithSections];

export default schemas;
