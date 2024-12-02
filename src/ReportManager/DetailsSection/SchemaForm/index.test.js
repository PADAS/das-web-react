import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../test-utils';

import SchemaForm from './';

describe('ReportManager - DetailsSection - SchemaForm', () => {
  const onFormChange = jest.fn();
  const onFormSubmit = jest.fn();
  const renderSubmitButton = jest.fn();

  let schema;
  beforeEach(() => {
    schema = {
      json: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        additionalProperties: false,
        properties: {
          this_is_a_text: {
            default: 'initial value',
            deprecated: false,
            description: 'some good description',
            title: 'This is a text',
            type: 'string',
          },
        },
        required: ['this_is_a_text'],
        type: 'object',
      },
      ui: {
        fields: {
          this_is_a_text: {
            inputType: 'SHORT_TEXT',
            placeholder: 'a placeholder',
            type: 'TEXT',
            parent: 'section-_PdgePvPWyACfu9sgN_F6',
          },
        },
        headers: {
          'header-ghqdjqGinaJMptIEJBQmO': {
            label: 'A great header',
            section: 'section-_PdgePvPWyACfu9sgN_F6',
            size: 'LARGE',
          },
        },
        order: ['section-_PdgePvPWyACfu9sgN_F6'],
        sections: {
          'section-_PdgePvPWyACfu9sgN_F6': {
            columns: 1,
            isActive: true,
            label: '',
            leftColumn: [
              {
                name: 'header-ghqdjqGinaJMptIEJBQmO',
                type: 'header',
              },
              {
                name: 'this_is_a_text',
                type: 'field',
              },
            ],
            rightColumn: [],
          },
        },
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderSchemaForm = (props) => render(<SchemaForm
    formData={{ this_is_a_text: 'a text value' }}
    onFormChange={onFormChange}
    onFormSubmit={onFormSubmit}
    renderSubmitButton={renderSubmitButton}
    schema={schema}
    {...props}
  />);

  test('renders a sections, fields and headers from the schema', () => {
    renderSchemaForm();

    const section = screen.getByTestId('schema-form-section-section-_PdgePvPWyACfu9sgN_F6');
    const textField = screen.getByTestId('schema-form-text-field-this_is_a_text');
    const header = screen.getByTestId('schema-form-header-header-ghqdjqGinaJMptIEJBQmO');

    expect(section).toBeVisible();
    expect(textField).toBeVisible();
    expect(header).toBeVisible();
  });

  test('renders the submit button', async () => {
    renderSchemaForm({ renderSubmitButton: () => <button data-testid="submit-button">Submit</button> });

    expect(screen.getByTestId('submit-button')).toBeVisible();
  });

  test('submits the form', async () => {
    renderSchemaForm();

    const inputField = screen.getByTestId(
      'schema-form-short-text-field-input-this_is_a_text'
    );

    await userEvent.type(inputField, '{enter}');

    expect(onFormSubmit).toHaveBeenCalledTimes(1);
    expect(onFormSubmit).toHaveBeenCalledWith({
      formData: {
        this_is_a_text: 'a text value',
      },
    });
  });
});
