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

const schemas = [schemaWithBasicText];

export default schemas;
