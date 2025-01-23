import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../../test-utils';

import Numeric from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - Numeric', () => {

  const onFieldChange = jest.fn();

  let details;
  beforeEach(() => {
    details = {
      'defaultInput': 100,
      'description': 'Numeric field description',
      'isRequired': false,
      'label': 'Numeric field label',
      'placeholder': 'Numeric field placeholder',
      'value': 'numeric-1',
      'maxInput': 200,
      'minInput': 1,
    };
  });

  const renderNumericField = (props) => render(<Numeric
        autofillDefaultInput={false}
        details={details}
        error={undefined}
        id="numeric-1"
        onFieldChange={onFieldChange}
        value={undefined}
        {...props}
    />);

  test('sets the default value when mounting the input if the autofill default input flag is on', () => {
    renderNumericField({ autofillDefaultInput: true });

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('numeric-1', 100);
  });

  test('does not change the input value automatically if there is no default input', () => {
    details.defaultInput = null;
    renderNumericField({ autofillDefaultInput: true });

    expect(onFieldChange).not.toHaveBeenCalled();
  });

  test('does not change the input value automatically if the autofill default input flag is off', () => {
    renderNumericField();

    expect(onFieldChange).not.toHaveBeenCalled();
  });

  test('shows a non required numeric field', () => {
    renderNumericField();

    expect(screen.getByText('Numeric field label')).toBeVisible();
    expect(screen.getByLabelText('Numeric field label')).not.toBeRequired();
  });

  test('shows a required numeric field', () => {
    details.isRequired = true;
    renderNumericField();

    expect(screen.getByText('Numeric field label *')).toBeVisible();
    expect(screen.getByLabelText('Numeric field label *')).toBeRequired();
  });

  test('does not show an error state in the label if the value is valid', () => {
    renderNumericField();

    expect(screen.getByText('Numeric field label')).not.toHaveClass('error');
  });

  test('shows an error state in the label if the value is invalid', () => {
    renderNumericField({ error: 'Error' });

    expect(screen.getByText('Numeric field label')).toHaveClass('error');
  });

  test('shows the field for numeric inputs', () => {
    renderNumericField();
    const input = screen.getByRole('textbox');

    expect(input.tagName).toBe('INPUT');
    expect(input.type).toBe('text');
    expect(input.inputMode).toBe('numeric');
  });

  test('does not show the description', () => {
    details.description = '';
    renderNumericField();

    expect(screen.queryByText('Numeric field description')).toBeNull();
    expect(screen.getByLabelText('Numeric field label')).not.toHaveAccessibleDescription();
  });

  test('shows the description', () => {
    renderNumericField();

    const description = screen.getByText('Numeric field description');

    expect(description).toBeVisible();
    expect(description).toHaveAttribute('aria-live', 'off');
    expect(description).not.toHaveClass('error');
    expect(screen.getByLabelText('Numeric field label')).toHaveAccessibleDescription('Numeric field description');
  });

  test('shows a valid input when there are errors', () => {
    renderNumericField();

    const textInput = screen.getByLabelText('Numeric field label');

    expect(textInput).toBeValid();
    expect(textInput).not.toHaveAccessibleErrorMessage();
  });

  test('shows an invalid input when there are errors', () => {
    renderNumericField({ error: 'Error' });

    const textInput = screen.getByLabelText('Numeric field label');
    const description = screen.getByText('Error');

    expect(textInput).toBeInvalid();
    expect(textInput).toHaveAccessibleErrorMessage('Error');
    expect(description).toBeVisible();
    expect(description).toHaveAttribute('aria-live', 'assertive');
    expect(description).toHaveClass('error');
  });

  test('updates the form data when the user does changes to the input', async () => {
    details.defaultInput = '';
    renderNumericField();

    await userEvent.type(screen.getByRole('textbox'), '1');

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('numeric-1', 1);
  });

  test('shows the placeholder', () => {
    renderNumericField();

    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Numeric field placeholder');
  });
});
