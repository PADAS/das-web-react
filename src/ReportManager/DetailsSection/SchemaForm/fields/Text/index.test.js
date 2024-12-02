import React from 'react';
import userEvent from '@testing-library/user-event';

import { FORM_ELEMENT_TYPES, ROOT_CANVAS_ID, TEXT_ELEMENT_INPUT_TYPES } from '../../constants';
import { render, screen } from '../../../../../test-utils';
import { SchemaFormContext } from '../../SchemaFormContext';

import Text from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Text', () => {
  const onFieldChange = jest.fn();

  let fields;
  beforeEach(() => {
    fields = {
      'text-1': {
        details: {
          defaultInput: 'Text 1 Default Input',
          description: 'Text 1 Description',
          inputType: TEXT_ELEMENT_INPUT_TYPES.SHORT,
          isRequired: false,
          label: 'Text 1 Label',
          placeholder: 'Text 1 Placeholder',
          value: 'text-1',
        },
        parentId: 'section-1',
        type: FORM_ELEMENT_TYPES.TEXT,
      },
      [ROOT_CANVAS_ID]: { details: { fields: ['section-1'] } },
      'section-1': {
        details: {
          columns: 2,
          label: 'Section 1 Label',
          leftColumn: ['text-1'],
          rightColumn: [],
        },
        parentId: ROOT_CANVAS_ID,
        type: FORM_ELEMENT_TYPES.SECTION,
      },
    };
  });

  const renderTextField = (props, context) => {
    render(<SchemaFormContext.Provider value={{
      fields,
      formData: {},
      onFieldChange,
      ...context
    }}>
      <Text id="text-1" {...props} />
    </SchemaFormContext.Provider>);
  };

  test('shows the label for non required fields', () => {
    renderTextField();

    expect(screen.getByText('Text 1 Label')).toBeVisible();
  });

  test('shows the label for required fields', () => {
    fields['text-1'].details.isRequired = true;
    renderTextField();

    expect(screen.getByText('Text 1 Label *')).toBeVisible();
  });

  test('does not change the input value automatically if there is no default input', () => {
    fields['text-1'].details.defaultInput = '';
    renderTextField();

    expect(onFieldChange).not.toHaveBeenCalled();
  });

  test('sets the default value when mounting the input', () => {
    renderTextField();

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('text-1', 'Text 1 Default Input');
  });

  test('updates the form data when the user does changes to the input if it is a short text input', async () => {
    fields['text-1'].details.defaultInput = '';
    renderTextField();

    await userEvent.type(screen.getByRole('textbox'), 'X');

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('text-1', 'X');
  });

  test('updates the form data when the user does changes to the input if it is a long text input', async () => {
    fields['text-1'].details.inputType = TEXT_ELEMENT_INPUT_TYPES.LONG;
    fields['text-1'].details.defaultInput = '';
    renderTextField();

    await userEvent.type(screen.getByRole('textbox'), 'X');

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('text-1', 'X');
  });

  test('shows the label', () => {
    renderTextField();

    expect(screen.getByLabelText('Text 1 Label')).toBeVisible();
  });

  test('shows the placeholder', () => {
    renderTextField();

    expect(screen.getByRole('textbox').placeholder).toBe('Text 1 Placeholder');
  });

  test('shows the field for short text input', () => {
    renderTextField();

    expect(screen.getByRole('textbox').tagName).toBe('INPUT');
  });

  test('shows the field for long text input', () => {
    fields['text-1'].details.inputType = TEXT_ELEMENT_INPUT_TYPES.LONG;
    renderTextField();

    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
  });

  test('shows the description', () => {
    renderTextField();

    expect(screen.getByText('Text 1 Description')).toBeVisible();
  });
});
