import React from 'react';

import { render, screen } from '../../../../../test-utils';
import { DATE_TIME_ELEMENT_INPUT_TYPES } from '../../../../../utils/v2-event-schemas/constants';

import DateTime from './';

describe('ReportManager - DetailsSection - SchemaForm - fields - DateTime', () => {
  const onFieldChange = jest.fn();

  let details;
  beforeEach(() => {
    details = {
      description: 'Date Time 1 Description',
      inputType: DATE_TIME_ELEMENT_INPUT_TYPES.DATE_TIME,
      isRequired: false,
      label: 'Date Time 1 Label',
      value: 'date-time-1',
    };
  });

  const renderDateTimeField = (props) => render(<DateTime
    details={details}
    error={undefined}
    id="date-time-1"
    onFieldChange={onFieldChange}
    value={undefined}
    {...props}
  />);

  test('shows a non read only date time field', () => {
    renderDateTimeField();

    expect(screen.getByRole('textbox', { name: 'Year' })).not.toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: 'Month' })).not.toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: 'Day' })).not.toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: 'Hour' })).not.toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: 'Minute' })).not.toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: 'Time period' })).not.toHaveAttribute('readonly');
  });

  test('shows a read only date time field', () => {
    renderDateTimeField({ readOnly: true });

    expect(screen.getByRole('textbox', { name: 'Year' })).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: 'Month' })).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: 'Day' })).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: 'Hour' })).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: 'Minute' })).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: 'Time period' })).toHaveAttribute('readonly');
  });

  test('shows a non required date time field', () => {
    renderDateTimeField();

    expect(screen.getAllByRole('group')[0]).toHaveAttribute('aria-required', 'false');
  });

  test('shows a required date time field', () => {
    details.isRequired = true;
    renderDateTimeField();

    expect(screen.getAllByRole('group')[0]).toHaveAttribute('aria-required', 'true');
  });

  test('does not show an error state in the label if the value is valid', () => {
    renderDateTimeField();

    expect(screen.getByText('Date Time 1 Label')).not.toHaveClass('error');
  });

  test('shows an error state in the label if the value is invalid', () => {
    renderDateTimeField({ error: { message: 'Error' } });

    expect(screen.getByText('Date Time 1 Label')).toHaveClass('error');
  });

  test('shows the field for date time inputs', () => {
    renderDateTimeField();

    expect(screen.getByTestId('schemaForm-field-dateTime-date-time-1')).toHaveClass('dateTimePicker');
  });

  test('shows the field for date inputs', () => {
    details.inputType = DATE_TIME_ELEMENT_INPUT_TYPES.DATE;
    renderDateTimeField();

    expect(screen.getByTestId('schemaForm-field-dateTime-date-time-1')).toHaveClass('datePicker');
  });

  test('shows the field for time inputs', () => {
    details.inputType = DATE_TIME_ELEMENT_INPUT_TYPES.TIME;
    renderDateTimeField();

    expect(screen.getByTestId('schemaForm-field-dateTime-date-time-1')).toHaveClass('timePicker');
  });

  test('does not show the description', () => {
    details.description = '';
    renderDateTimeField();

    expect(screen.getAllByRole('group')[0]).not.toHaveAccessibleDescription();
  });

  test('shows the description', () => {
    renderDateTimeField();

    const description = screen.getByRole('paragraph');

    expect(description).not.toHaveClass('error');
    expect(description).toHaveTextContent('Date Time 1 Description');
    expect(screen.getAllByRole('group')[0]).toHaveAccessibleDescription('Date Time 1 Description');
  });

  test('shows a valid input when there are no errors', () => {
    renderDateTimeField();

    const dateTimeInput = screen.getByTestId('schemaForm-field-dateTime-date-time-1');

    expect(dateTimeInput).toBeValid();
    expect(dateTimeInput).not.toHaveAccessibleErrorMessage();
  });

  test('shows an invalid input when there are errors', () => {
    renderDateTimeField({ error: { message: 'Error' } });

    const dateTimeInput = screen.getByTestId('schemaForm-field-dateTime-date-time-1');
    const description = screen.getByText('Error');

    expect(dateTimeInput).toBeInvalid();
    expect(dateTimeInput).toHaveAccessibleErrorMessage('Error');
    expect(description).toHaveClass('error');
  });
});
