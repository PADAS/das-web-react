import React from 'react';
import userEvent from '@testing-library/user-event';

import { TEXT_ELEMENT_INPUT_TYPES } from '../../constants';
import { render, screen } from '../../../../../test-utils';

import Text from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Text', () => {
  const onFieldChange = jest.fn();

  let details;
  beforeEach(() => {
    details = {
      defaultInput: 'Text 1 Default Input',
      description: 'Text 1 Description',
      inputType: TEXT_ELEMENT_INPUT_TYPES.SHORT,
      isRequired: false,
      label: 'Text 1 Label',
      placeholder: 'Text 1 Placeholder',
      value: 'text-1',
    };
  });

  const renderTextField = (props) => render(<Text
    details={details}
    error={undefined}
    id="text-1"
    onFieldChange={onFieldChange}
    value={undefined}
    {...props}
  />);

  test('shows the label for non required fields', () => {
    renderTextField();

    expect(screen.getByText('Text 1 Label')).toBeVisible();
    expect(screen.getByLabelText('Text 1 Label')).not.toBeRequired();
  });

  test('shows the label for required fields', () => {
    details.isRequired = true;
    renderTextField();

    expect(screen.getByText('Text 1 Label *')).toBeVisible();
    expect(screen.getByLabelText('Text 1 Label *')).toBeRequired();
  });

  test('does not show an error state in the label if the value is valid', () => {
    renderTextField();

    expect(screen.getByText('Text 1 Label')).not.toHaveClass('error');
  });

  test('shows an error state in the label if the value is invalid', () => {
    renderTextField({ error: 'Error' });

    expect(screen.getByText('Text 1 Label')).toHaveClass('error');
  });

  test('shows the field for short text inputs', () => {
    renderTextField();

    expect(screen.getByRole('textbox').tagName).toBe('INPUT');
  });

  test('shows the field for long text inputs', () => {
    details.inputType = TEXT_ELEMENT_INPUT_TYPES.LONG;
    renderTextField();

    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
  });

  test('does not show the description', () => {
    details.description = '';
    renderTextField();

    expect(screen.queryByText('Text 1 Description')).toBeNull();
    expect(screen.getByLabelText('Text 1 Label')).not.toHaveAccessibleDescription();
  });

  test('shows the description', () => {
    renderTextField();

    const description = screen.getByText('Text 1 Description');

    expect(description).toBeVisible();
    expect(description).toHaveAttribute('aria-live', 'off');
    expect(description).not.toHaveClass('error');
    expect(screen.getByLabelText('Text 1 Label')).toHaveAccessibleDescription('Text 1 Description');
  });

  test('shows the input without an error state when it is valid', () => {
    renderTextField();

    const textInput = screen.getByLabelText('Text 1 Label');

    expect(textInput).toBeValid();
    expect(textInput).not.toHaveAccessibleErrorMessage();
  });

  test('shows the input with an error state when it is invalid', () => {
    renderTextField({ error: 'Error' });

    const textInput = screen.getByLabelText('Text 1 Label');
    const description = screen.getByText('Error');

    expect(textInput).toBeInvalid();
    expect(textInput).toHaveAccessibleErrorMessage('Error');
    expect(description).toBeVisible();
    expect(description).toHaveAttribute('aria-live', 'assertive');
    expect(description).toHaveClass('error');
  });

  test('does not change the input value automatically if there is no default input', () => {
    details.defaultInput = '';
    renderTextField();

    expect(onFieldChange).not.toHaveBeenCalled();
  });

  test('sets the default value when mounting the input', () => {
    renderTextField();

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('text-1', 'Text 1 Default Input');
  });

  test('updates the form data when the user does changes to the input', async () => {
    details.defaultInput = '';
    renderTextField();

    await userEvent.type(screen.getByRole('textbox'), 'X');

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('text-1', 'X');
  });

  test('shows the placeholder', () => {
    renderTextField();

    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Text 1 Placeholder');
  });
});
