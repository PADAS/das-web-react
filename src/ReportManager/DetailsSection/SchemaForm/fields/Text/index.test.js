import React from 'react';

import { render, screen } from '../../../../../test-utils';
import SchemaFormContextProvider from '../../SchemaFormContext';
import Text from './';
import userEvent from '@testing-library/user-event';

describe('ReportManager - SchemaForm - fields - TextField', () => {

  const defaultSchema = {
    'json': {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      'additionalProperties': false,
      'properties': {
        'short_text': {
          'default': '',
          'deprecated': false,
          'description': 'This text will help you a lot in the field when you need extra information about the event.',
          'title': 'Field text label',
          'type': 'string'
        }
      },
      'required': [],
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
            }
          ],
          'rightColumn': []
        }
      }
    }
  };

  const initialContextProps = {
    schema: defaultSchema,
    onFormChange: () => {},
    formData: {},
    formErrors: {}
  };

  const renderTextField = (contextProps = initialContextProps) => {
    render(
      <SchemaFormContextProvider {...contextProps}>
        <Text fieldName='short_text' />
      </SchemaFormContextProvider>
    );
  };

  test('shows label properly', () => {
    renderTextField();

    expect( screen.getByText('Field text label') ).toBeVisible();
  });

  test('shows label properly when field is required', () => {

    const schema = defaultSchema;
    schema.json.required = ['short_text'];

    renderTextField({
      ...initialContextProps,
      schema
    });

    expect( screen.getByText('Field text label *') ).toBeVisible();
  });

  test('adds default value to input field', () => {
    const schema = defaultSchema;
    schema.json.properties.short_text.default = 'This is a default value';

    renderTextField({
      ...initialContextProps,
      schema
    });

    expect( screen.getByRole('textbox').value ).toBe('This is a default value');
  });

  test('adds form value to input field', () => {
    renderTextField({
      ...initialContextProps,
      formData: {
        'short_text': 'Some value'
      }
    });

    expect( screen.getByRole('textbox').value ).toBe('Some value');
  });

  test('behaves correctly when use types in it', async () => {
    const onFormChange = jest.fn();

    renderTextField({
      ...initialContextProps,
      onFormChange,
    });

    await userEvent.type(screen.getByRole('textbox'), 'X');

    expect(onFormChange).toHaveBeenCalledWith({
      formData: {
        'short_text': 'This is a default valueX'
      }
    });
  });

  test('shows place holder properly', () => {
    renderTextField();

    expect( screen.getByRole('textbox').placeholder ).toBe('Ex. of data');
  });

  test('shows input text type when field is SHORT_TEXT type', () => {
    renderTextField();

    expect( screen.getByRole('textbox').tagName ).toBe('INPUT');
  });

  test('shows text area when field is LONG_TEXT type', () => {
    const schema = defaultSchema;
    schema.ui.fields.short_text.inputType = 'LONG_TEXT';

    renderTextField({
      ...initialContextProps,
      schema
    });

    expect( screen.getByRole('textbox').tagName ).toBe('TEXTAREA');
  });

  test('shows description properly', () => {
    renderTextField();

    expect( screen.getByText('This text will help you a lot in the field when you need extra information about the event.') ).toBeVisible();
  });


});
