import React from 'react';
import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen } from '../test-utils';

import DateTimePicker, { EMPTY_DATE_TIME_VALUE } from '.';

describe('DateTimePicker', () => {
  const onChange = jest.fn();

  const renderDateTimePicker = (props) => render(<DateTimePicker
    data-testid="dateTimePicker"
    onChange={onChange}
    value={EMPTY_DATE_TIME_VALUE}
    {...props}
  />);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('adds a custom class name', () => {
    renderDateTimePicker({ className: 'className' });

    expect(screen.getByTestId('dateTimePicker')).toHaveClass('className');
  });

  test('customizes the date picker', () => {
    renderDateTimePicker({ datePickerProps: { className: 'className', 'data-testid': 'datePicker' } });

    expect(screen.getByTestId('datePicker')).toHaveClass('className');
  });

  test('customizes the time picker', () => {
    renderDateTimePicker({ timePickerProps: { className: 'className', 'data-testid': 'timePicker' } });

    expect(screen.getByTestId('timePicker')).toHaveClass('className');
  });

  test('does not disable the date time picker', () => {
    renderDateTimePicker({
      datePickerProps: { 'data-testid': 'datePicker' },
      timePickerProps: { 'data-testid': 'timePicker' },
    });

    const dateTimePicker = screen.getByTestId('dateTimePicker');

    expect(dateTimePicker).not.toHaveClass('disabled');
    expect(screen.getByTestId('datePicker')).not.toHaveClass('disabled');
    expect(screen.getByTestId('timePicker')).not.toHaveClass('disabled');
  });

  test('disables the date time picker', () => {
    renderDateTimePicker({
      datePickerProps: { 'data-testid': 'datePicker' },
      disabled: true,
      timePickerProps: { 'data-testid': 'timePicker' },
    });

    expect(screen.getByTestId('datePicker')).toHaveClass('disabled');
    expect(screen.getByTestId('timePicker')).toHaveClass('disabled');
  });

  test('sets the name to an input with the date time picker value', () => {
    renderDateTimePicker({ name: 'date-time-picker-name', value: '2020-01-01T06:30' });

    const dateTimePickerInput = screen.getByTestId('dateTimePicker-input');

    expect(dateTimePickerInput).toHaveAttribute('name', 'date-time-picker-name');
    expect(dateTimePickerInput).toHaveValue('2020-01-01T06:30');
  });

  test('blurs the date picker', () => {
    const onBlur = jest.fn();

    renderDateTimePicker({ onBlur });

    const dateTimePicker = screen.getByTestId('dateTimePicker');
    userEvent.click(dateTimePicker);

    expect(onBlur).not.toHaveBeenCalled();

    fireEvent.blur(dateTimePicker);

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test('focuses the date time picker when focusing one of the inner elements', () => {
    const onFocus = jest.fn();

    renderDateTimePicker({ onFocus });

    expect(onFocus).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Year'));

    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  test('does not set the date time picker as read only', () => {
    renderDateTimePicker();

    expect(screen.getByLabelText('Year')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('Hour')).not.toHaveAttribute('readonly');
  });

  test('sets the date time picker as read only', () => {
    renderDateTimePicker({ readOnly: true });

    expect(screen.getByLabelText('Year')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Hour')).toHaveAttribute('readonly');
  });

  test('does not set the date time picker as required', () => {
    renderDateTimePicker();

    expect(screen.getByLabelText('Year')).not.toBeRequired();
    expect(screen.getByLabelText('Hour')).not.toBeRequired();
  });

  test('sets the date time picker as required', () => {
    renderDateTimePicker({ required: true });

    expect(screen.getByLabelText('Year')).toBeRequired();
    expect(screen.getByLabelText('Hour')).toBeRequired();
  });

  test('changes when the user modifies the date', () => {
    renderDateTimePicker({ value: '2020-01-01T06:30' });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Open calendar'));
    userEvent.click(screen.getByLabelText('Choose Monday, January 13th, 2020'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2020-01-13T06:30');
  });

  test('autofills the time to 00:00 when changing the date if the time is empty', () => {
    renderDateTimePicker({ value: '2020-01-01T:' });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Open calendar'));
    userEvent.click(screen.getByLabelText('Choose Monday, January 13th, 2020'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2020-01-13T00:00');
  });

  test('changes when the user modifies the time', () => {
    renderDateTimePicker({ value: '--T06:30' });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Open time options'));
    userEvent.click(screen.getByText('08:00 AM'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('--T08:00');
  });

  test('applies the max to the date picker', () => {
    renderDateTimePicker({ max: '2020-01-15T15:00', value: '2020-01-01T06:30' });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Open calendar'));
    userEvent.click(screen.getByLabelText('Not available Thursday, January 16th, 2020'));

    expect(onChange).not.toHaveBeenCalled();
  });

  test('applies the min to the date picker', () => {
    renderDateTimePicker({ min: '2020-01-15T15:00', value: '2020-01-25T06:30' });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Open calendar'));
    userEvent.click(screen.getByLabelText('Not available Monday, January 13th, 2020'));

    expect(onChange).not.toHaveBeenCalled();
  });

  test('applies the max to the time picker if the date is the max value', () => {
    renderDateTimePicker({ max: '2020-01-15T15:00', value: '2020-01-15T06:30' });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Open time options'));

    expect(screen.queryByText('03:30 PM')).toBeNull();
  });

  test('does not apply the max to the time picker if the date is below the max value', () => {
    renderDateTimePicker({ max: '2020-01-15T15:00', value: '2020-01-14T06:30' });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Open time options'));

    expect(screen.getByText('03:30 PM')).toBeVisible();
  });

  test('applies the min to the time picker if the date is the min value', () => {
    renderDateTimePicker({ min: '2020-01-15T15:00', value: '2020-01-15T20:30' });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Open time options'));

    expect(screen.queryByText('02:30 PM')).toBeNull();
  });

  test('does not apply the min to the time picker if the date is above the max value', () => {
    renderDateTimePicker({ max: '2020-01-15T15:00', value: '2020-01-16T20:30' });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Open time options'));

    expect(screen.getByText('02:30 PM')).toBeVisible();
  });
});
