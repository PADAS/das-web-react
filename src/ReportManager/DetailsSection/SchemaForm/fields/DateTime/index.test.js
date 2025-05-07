import React from 'react';
import { format, parseISO } from 'date-fns';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../../test-utils';
import { DATE_TIME_ELEMENT_INPUT_TYPES } from '../../constants';

import DateTime from './';

const transformISOToCurrentTimezone = (dateValue) => format(parseISO(dateValue), 'yyyy-MM-dd\'T\'HH:mm:ssXXX');

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

  test('shows a non required date time field', () => {
    renderDateTimeField();

    expect(screen.getByText('Date Time 1 Label')).toBeVisible();
    expect(screen.getByTestId('schemaForm-field-dateTime-date-time-1')).toHaveAttribute('aria-required', 'false');
  });

  test('shows a required date time field', () => {
    details.isRequired = true;
    renderDateTimeField();

    expect(screen.getByText('Date Time 1 Label *')).toBeVisible();
    expect(screen.getByTestId('schemaForm-field-dateTime-date-time-1')).toHaveAttribute('aria-required', 'true');
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

    expect(screen.queryByText('Date Time 1 Description')).toBeNull();
    expect(screen.getByTestId('schemaForm-field-dateTime-date-time-1')).not.toHaveAccessibleDescription();
  });

  test('shows the description', () => {
    renderDateTimeField();

    const description = screen.getByText('Date Time 1 Description');

    expect(description).toBeVisible();
    expect(description).toHaveAttribute('aria-live', 'off');
    expect(description).not.toHaveClass('error');
    expect(screen.getByTestId('schemaForm-field-dateTime-date-time-1')).toHaveAccessibleDescription('Date Time 1 Description');
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
    expect(description).toBeVisible();
    expect(description).toHaveAttribute('aria-live', 'assertive');
    expect(description).toHaveClass('error');
  });

  test('adjusts the value to the client timezone offset', async () => {
    const utcValue = '2020-01-01T06:30:00Z';
    renderDateTimeField({ value: utcValue });

    expect(onFieldChange).toHaveBeenCalledTimes(1);
    expect(onFieldChange).toHaveBeenCalledWith('date-time-1', transformISOToCurrentTimezone(utcValue));
  });

  /*  test('updates the form data when the user does changes to the input', async () => {
     renderDateTimeField({ value: '2020-01-01T06:30:00Z' });
 
     expect(onFieldChange).toHaveBeenCalledTimes(1);
 
     await userEvent.click(screen.getByLabelText('Open calendar'));
     await userEvent.click(screen.getByLabelText('Choose Monday, January 13th, 2020'));
 
     expect(onFieldChange).toHaveBeenCalledTimes(2);
     expect(onFieldChange).toHaveBeenCalledWith('date-time-1', transformISOToCurrentTimezone('2020-01-13T06:30'));
 
     await userEvent.click(screen.getByLabelText('Open time options'));
     await userEvent.click(screen.getByText('08:00 AM'));
 
     expect(onFieldChange).toHaveBeenCalledTimes(3);
     expect(onFieldChange.mock.calls[2][0]).toBe('date-time-1');
     expect(onFieldChange).toHaveBeenCalledWith('date-time-1', transformISOToCurrentTimezone('2020-01-01T08:00'));
   }); */
});
