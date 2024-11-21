import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../../../test-utils';

import SchemaForm from './';

describe('ReportManager - SchemaForm', () => {

  const schema = {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'this_is_a_text': {
          'default': 'initial value',
          'deprecated': false,
          'description': 'some good description',
          'title': 'This is a text',
          'type': 'string'
        }
      },
      'required': [
        'this_is_a_text'
      ],
      'type': 'object'
    },
    'ui': {
      'fields': {
        'this_is_a_text': {
          'inputType': 'SHORT_TEXT',
          'placeholder': 'a placeholder',
          'type': 'TEXT',
          'parent': 'section-_PdgePvPWyACfu9sgN_F6'
        }
      },
      'headers': {
        'header-ghqdjqGinaJMptIEJBQmO': {
          'label': 'A great header',
          'section': 'section-_PdgePvPWyACfu9sgN_F6',
          'size': 'LARGE'
        }
      },
      'order': [
        'section-_PdgePvPWyACfu9sgN_F6'
      ],
      'sections': {
        'section-_PdgePvPWyACfu9sgN_F6': {
          'columns': 1,
          'isActive': true,
          'label': '',
          'leftColumn': [
            {
              'name': 'header-ghqdjqGinaJMptIEJBQmO',
              'type': 'header'
            },
            {
              'name': 'this_is_a_text',
              'type': 'field'
            }
          ],
          'rightColumn': []
        }
      }
    }
  };

  const initialProps = {
    schema,
    formData: {
      'this_is_a_text': 'a text value'
    },
    onFormSubmit: () => {},
    className: '',
    onFormChange: () => {},
    renderSubmitButton: () => ''
  };

  const renderSchemaForm = (props = initialProps) => {
    return render(
      <SchemaForm {...props} />
    );
  };

  test('renders text field properly', () => {
    renderSchemaForm();

    const textFieldElement = screen.getByTestId('schema-form-text-field-this_is_a_text');

    expect(within(textFieldElement).getByLabelText('This is a text')).toBeInTheDocument();
    expect(within(textFieldElement).getByText('some good description')).toBeInTheDocument();

    const inputField = within(textFieldElement).getByTestId('schema-form-text-field-input-this_is_a_text');
    expect(inputField.value).toBe('a text value');
    expect(inputField.placeholder).toBe('a placeholder');
  });

  test('update text field when user types in it', async () => {
    const onFormChange = jest.fn();
    renderSchemaForm({ ...initialProps, onFormChange });

    const inputField = screen.getByTestId('schema-form-text-field-input-this_is_a_text');
    await userEvent.type(inputField, 'A');

    expect(onFormChange).toHaveBeenCalledTimes(1);
    expect(onFormChange).toHaveBeenCalledWith({
      formData: {
        'this_is_a_text': 'a text valueA'
      }
    });
  });

  test('show validation error for text field on submit', async () => {

    const updateSchema = { ...schema };
    updateSchema.json.properties.this_is_a_text.default = '';

    renderSchemaForm({
      ...initialProps,
      schema: updateSchema,
      formData: {
        'this_is_a_text': ''
      }
    });

    const inputField = screen.getByTestId('schema-form-text-field-input-this_is_a_text');
    await userEvent.type(inputField, '{enter}');

    expect( screen.getByText('Error message') ).toBeVisible();
  });

  test('submit form with text field data', async () => {
    const onFormSubmit = jest.fn();

    renderSchemaForm({
      ...initialProps,
      onFormSubmit,
    });

    const inputField = screen.getByTestId('schema-form-text-field-input-this_is_a_text');

    await userEvent.type(inputField, '{enter}');

    expect(onFormSubmit).toHaveBeenCalledTimes(1);
    expect(onFormSubmit).toHaveBeenCalledWith({
      formData: {
        'this_is_a_text': 'a text value'
      }
    });

  });


});