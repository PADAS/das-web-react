import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../test-utils';

import SchemaForm from './';

describe('ReportManager - DetailsSection - SchemaForm', () => {
  const onFormDataChange = jest.fn();
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
    autofillDefaultInputs={false}
    initialFormData={{ this_is_a_text: 'a text value' }}
    onFormDataChange={onFormDataChange}
    onFormSubmit={onFormSubmit}
    renderSubmitButton={renderSubmitButton}
    schema={schema}
    {...props}
  />);

  test('renders sections, fields and headers from the schema', () => {
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

  test('shows the values of the fields', async () => {
    renderSchemaForm();

    expect(screen.getByLabelText('This is a text *')).toHaveValue('a text value');
  });

  test('changes the field values when the user interacts with them', async () => {
    renderSchemaForm();

    const inputField = screen.getByLabelText('This is a text *');

    expect(inputField).toHaveValue('a text value');
    expect(onFormDataChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('This is a text *'), ' ');

    expect(inputField).toHaveValue('a text value ');
    expect(onFormDataChange).toHaveBeenCalledTimes(1);
    expect(onFormDataChange).toHaveBeenCalledWith({ this_is_a_text: 'a text value ' });
  });

  test('shows validation errors if there are any when the user submits the form', async () => {
    renderSchemaForm({ initialFormData: { this_is_a_text: undefined } });

    const inputField = screen.getByLabelText('This is a text *');

    expect(inputField).toBeValid();
    expect(inputField).not.toHaveAccessibleErrorMessage();

    await userEvent.type(inputField, '{enter}');

    expect(onFormSubmit).not.toHaveBeenCalled();
    expect(inputField).toBeInvalid();
    expect(inputField).toHaveAccessibleErrorMessage('This is a required field.');
  });

  test('clears validation errors of a field when the user changes its value', async () => {
    renderSchemaForm({ initialFormData: { this_is_a_text: undefined } });

    const inputField = screen.getByLabelText('This is a text *');
    await userEvent.type(inputField, '{enter}');

    expect(inputField).toBeInvalid();
    expect(inputField).toHaveAccessibleErrorMessage('This is a required field.');

    await userEvent.type(screen.getByLabelText('This is a text *'), 'a');

    expect(inputField).toBeValid();
    expect(inputField).not.toHaveAccessibleErrorMessage();
  });

  test('submits the form when there are no validation errors', async () => {
    renderSchemaForm();

    const inputField = screen.getByLabelText('This is a text *');
    await userEvent.type(inputField, '{enter}');

    expect(onFormSubmit).toHaveBeenCalledTimes(1);
  });
});
