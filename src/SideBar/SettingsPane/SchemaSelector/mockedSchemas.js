const schemaWithBasicText = {
  label: 'Long and short text',
  schema: {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'short_text': {
          'default': '',
          'deprecated': false,
          'description': 'This text will help you a lot in the field when you need extra information about the event.',
          'title': 'Short text',
          'type': 'string'
        },
        'long_text': {
          'default': '',
          'deprecated': false,
          'description': 'Please add more information about this long text stuff',
          'title': 'Long text',
          'type': 'string'
        }
      },
      'required': [
        'short_text'
      ],
      'type': 'object'
    },
    'ui': {
      'fields': {
        'short_text': {
          'inputType': 'SHORT_TEXT',
          'placeholder': 'Ex. of data',
          'type': 'TEXT',
          'parent': 'section-GQi_CTfZ9ZH-CcSnr-OKa'
        },
        'long_text': {
          'inputType': 'LONG_TEXT',
          'placeholder': 'This is an example of long text',
          'type': 'TEXT',
          'parent': 'section-GQi_CTfZ9ZH-CcSnr-OKa'
        }
      },
      'headers': {},
      'order': [
        'section-GQi_CTfZ9ZH-CcSnr-OKa'
      ],
      'sections': {
        'section-GQi_CTfZ9ZH-CcSnr-OKa': {
          'columns': 1,
          'isActive': true,
          'label': '',
          'leftColumn': [
            {
              'name': 'short_text',
              'type': 'field'
            },
            {
              'name': 'long_text',
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
