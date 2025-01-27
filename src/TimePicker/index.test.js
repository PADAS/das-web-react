import React from 'react';
import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen, waitFor } from '../test-utils';
import { shouldUse12HourFormat } from '../utils/datetime';

import TimePicker, { EMPTY_TIME_VALUE } from '.';

jest.mock('../utils/datetime', () => ({
  ...jest.requireActual('../utils/datetime'),
  shouldUse12HourFormat: jest.fn(),
}));

describe('TimePicker', () => {
  const onChange = jest.fn();

  const renderTimePicker = (props) => render(<TimePicker
    data-testid="timePicker"
    onChange={onChange}
    value={EMPTY_TIME_VALUE}
    {...props}
  />);

  beforeEach(() => {
    shouldUse12HourFormat.mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('adds a custom class name', () => {
    renderTimePicker({ className: 'className' });

    expect(screen.getByTestId('timePicker')).toHaveClass('className');
  });

  test('does not disable the time picker', () => {
    renderTimePicker();

    const timePicker = screen.getByTestId('timePicker');

    expect(timePicker).not.toHaveClass('disabled');
    expect(screen.getByLabelText('Hour')).not.toBeDisabled();
    expect(screen.getByLabelText('Minute')).not.toBeDisabled();
    expect(screen.getByLabelText('Time period')).not.toBeDisabled();
    expect(screen.getByLabelText('Open time options')).not.toBeDisabled();
  });

  test('disables the time picker', () => {
    renderTimePicker({ disabled: true });

    const timePicker = screen.getByTestId('timePicker');

    expect(timePicker).toHaveClass('disabled');
    expect(screen.getByLabelText('Hour')).toBeDisabled();
    expect(screen.getByLabelText('Minute')).toBeDisabled();
    expect(screen.getByLabelText('Time period')).toBeDisabled();
    expect(screen.getByLabelText('Open time options')).toBeDisabled();
  });

  test('sets the name to an input with the time picker value', () => {
    renderTimePicker({ name: 'time-picker-name', value: '06:30' });

    const timePickerInput = screen.getByTestId('timePicker-input');

    expect(timePickerInput).toHaveAttribute('name', 'time-picker-name');
    expect(timePickerInput).toHaveValue('06:30');
  });

  test('blurs the time picker', () => {
    const onBlur = jest.fn();

    renderTimePicker({ onBlur });

    const timePicker = screen.getByTestId('timePicker');
    userEvent.click(timePicker);

    expect(onBlur).not.toHaveBeenCalled();

    fireEvent.blur(timePicker);

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test('focuses the time picker when focusing one of the inner elements', () => {
    const onFocus = jest.fn();

    renderTimePicker({ onFocus });

    expect(onFocus).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Hour'));

    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  test('does not set the time picker as read only', () => {
    renderTimePicker();

    expect(screen.getByLabelText('Hour')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('Minute')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('Time period')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('Open time options')).not.toBeDisabled();
  });

  test('sets the time picker as read only', () => {
    renderTimePicker({ readOnly: true });

    expect(screen.getByLabelText('Hour')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Minute')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Time period')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Open time options')).toBeDisabled();
  });

  test('does not set the time picker as required', () => {
    renderTimePicker();

    expect(screen.getByLabelText('Hour')).not.toBeRequired();
    expect(screen.getByLabelText('Minute')).not.toBeRequired();
  });

  test('sets the time picker as required', () => {
    renderTimePicker({ required: true });

    expect(screen.getByLabelText('Hour')).toBeRequired();
    expect(screen.getByLabelText('Minute')).toBeRequired();
  });

  test('uses a 12 hour format depending on the locale', () => {
    renderTimePicker({ value: '20:00' });

    const timePeriodInput = screen.getByLabelText('Time period');

    expect(screen.getByLabelText('Hour')).toHaveValue('08');
    expect(screen.getByLabelText('Minute')).toHaveValue('00');
    expect(timePeriodInput).toBeVisible();
    expect(timePeriodInput).toHaveValue('PM');
  });

  test('uses a 24 hour format depending on the locale', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    renderTimePicker({ value: '20:00' });

    expect(screen.getByLabelText('Hour')).toHaveValue('20');
    expect(screen.getByLabelText('Minute')).toHaveValue('00');
    expect(screen.queryByLabelText('Time period')).toBeNull();
  });

  test('autofills the first digit when the user modifies the hour input with a number over 1 for 12 hour format', () => {
    renderTimePicker();

    expect(onChange).not.toHaveBeenCalled();

    userEvent.type(screen.getByLabelText('Hour'), '2');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('02:');
  });

  test('autofills the first digit when the user modifies the hour input with a number over 2 for 24 hour format', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    renderTimePicker();

    expect(onChange).not.toHaveBeenCalled();

    userEvent.type(screen.getByLabelText('Hour'), '3');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('03:');
  });

  test('autofills the first digit when the hour input is blurred and it has a digit below 2 for 12 hour format', () => {
    renderTimePicker({ value: '1:' });

    expect(onChange).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText('Hour'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('01:');
  });

  test('autofills the first digit when the hour input is blurred and it has a digit below 3 for 24 hour format', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    renderTimePicker({ value: '2:' });

    expect(onChange).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText('Hour'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('02:');
  });

  test('changes when the user modifies the hour input with a valid value', () => {
    renderTimePicker();

    expect(onChange).not.toHaveBeenCalled();

    userEvent.type(screen.getByLabelText('Hour'), '1');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('1:');
  });

  test('changes when the user clears the hour input', () => {
    renderTimePicker({ value: '1:' });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.type(screen.getByLabelText('Hour'), '{backspace}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(EMPTY_TIME_VALUE);
  });

  test('does not change when the user modifies the hour input with an invalid value', () => {
    renderTimePicker();

    expect(onChange).not.toHaveBeenCalled();

    userEvent.type(screen.getByLabelText('Hour'), 'a');

    expect(onChange).not.toHaveBeenCalled();
  });

  test('sets the max hour as the new hour value if the new hour is above the max hour for 24 hour format', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    const { rerender } = renderTimePicker({ max: '15:00' });

    userEvent.click(screen.getByLabelText('Hour'));

    rerender(<TimePicker data-testid="timePicker" max="15:00" onChange={onChange} value="1:" />);

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('7');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('15:');
  });

  test('sets the max minute as the new minute value if the new hour is the max value and the old minute was above the max minute for 24 hour format', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    const { rerender } = renderTimePicker({ max: '15:00' });

    userEvent.click(screen.getByLabelText('Hour'));

    rerender(<TimePicker data-testid="timePicker" max="15:00" onChange={onChange} value="1:30" />);

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('5');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('15:00');
  });

  test('sets the min hour as the new hour value if the new hour is below the min hour for 24 hour format', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    const { rerender } = renderTimePicker({ min: '15:00' });

    userEvent.click(screen.getByLabelText('Hour'));

    rerender(<TimePicker data-testid="timePicker" min="15:00" onChange={onChange} value="1:" />);

    userEvent.keyboard('1');

    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith('15:');
  });

  test('sets the min minute as the new minute value if the new hour is the min value and the old minute was below the min minute for 24 hour format', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    const { rerender } = renderTimePicker({ min: '15:30' });

    userEvent.click(screen.getByLabelText('Hour'));

    rerender(<TimePicker data-testid="timePicker" min="15:30" onChange={onChange} value="1:15" />);

    userEvent.keyboard('5');

    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith('15:30');
  });

  test('focuses the minute input if the focus is on the hour input and the user presses the right arrow', () => {
    renderTimePicker();

    userEvent.click(screen.getByLabelText('Hour'));
    const minuteInput = screen.getByLabelText('Minute');

    expect(minuteInput).not.toHaveFocus();

    userEvent.keyboard('[ArrowRight]');

    expect(minuteInput).toHaveFocus();
  });

  test('sets the hour to 01 if the input is empty and focused and the user presses the up arrow for 12 hour format', () => {
    renderTimePicker();

    userEvent.click(screen.getByLabelText('Hour'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('01:');
  });

  test('sets the hour to 00 if the input is empty and focused and the user presses the up arrow for 24 hour format', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    renderTimePicker();

    userEvent.click(screen.getByLabelText('Hour'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('00:');
  });

  test('sets the hour to 13: if the input has the value 12 and is focused and the user presses the up arrow for 12 hour format', () => {
    renderTimePicker({ value: '12:' });

    userEvent.click(screen.getByLabelText('Hour'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('13:');
  });

  test('sets the hour to 00 if the input has the value 23 and is focused and the user presses the up arrow for 24 hour format', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    renderTimePicker({ value: '23:' });

    userEvent.click(screen.getByLabelText('Hour'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('00:');
  });

  test('increments the hour if the input has a valid value and is focused and the user presses the up arrow for 12 hour format', () => {
    renderTimePicker({ value: '15:' });

    userEvent.click(screen.getByLabelText('Hour'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('16:');
  });

  test('increments the hour if the input has a valid value and is focused and the user presses the up arrow for 24 hour format', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    renderTimePicker({ value: '15:' });

    userEvent.click(screen.getByLabelText('Hour'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('16:');
  });

  test('sets the hour to 00 if the input is empty and focused and the user presses the down arrow for 12 hour format', () => {
    renderTimePicker();

    userEvent.click(screen.getByLabelText('Hour'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('00:');
  });

  test('sets the hour to 23 if the input is empty and focused and the user presses the down arrow for 24 hour format', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    renderTimePicker();

    userEvent.click(screen.getByLabelText('Hour'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('23:');
  });

  test('sets the hour to 00: if the input has the value 01 and is focused and the user presses the down arrow for 12 hour format', () => {
    renderTimePicker({ value: '01:' });

    userEvent.click(screen.getByLabelText('Hour'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('00:');
  });

  test('sets the hour to 23 if the input has the value 00 and is focused and the user presses the down arrow for 24 hour format', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    renderTimePicker({ value: '00:' });

    userEvent.click(screen.getByLabelText('Hour'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('23:');
  });

  test('decrements the hour if the input has a valid value and is focused and the user presses the down arrow for 12 hour format', () => {
    renderTimePicker({ value: '15:' });

    userEvent.click(screen.getByLabelText('Hour'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('14:');
  });

  test('decrements the hour if the input has a valid value and is focused and the user presses the down arrow for 24 hour format', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    renderTimePicker({ value: '15:' });

    userEvent.click(screen.getByLabelText('Hour'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('14:');
  });

  test('focuses the minute input automatically when the user finishes typing a valid hour', () => {
    const { rerender } = renderTimePicker();

    userEvent.click(screen.getByLabelText('Hour'));
    const minuteInput = screen.getByLabelText('Minute');

    expect(minuteInput).not.toHaveFocus();

    rerender(<TimePicker data-testid="timePicker" onChange={onChange} value="1:" />);
    userEvent.keyboard('0');

    expect(minuteInput).toHaveFocus();
  });

  test('autofills the first digit when the user modifies the minute input with a number over 5', () => {
    renderTimePicker();

    expect(onChange).not.toHaveBeenCalled();

    userEvent.type(screen.getByLabelText('Minute'), '6');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(':06');
  });

  test('autofills the first digit when the minute input is blurred and it has a digit below 6', () => {
    renderTimePicker({ value: ':5' });

    expect(onChange).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText('Minute'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(':05');
  });

  test('changes when the user modifies the minute input with a valid value', () => {
    renderTimePicker();

    expect(onChange).not.toHaveBeenCalled();

    userEvent.type(screen.getByLabelText('Minute'), '1');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(':1');
  });

  test('changes when the user clears the minute input', () => {
    renderTimePicker({ value: ':1' });

    expect(onChange).not.toHaveBeenCalled();

    userEvent.type(screen.getByLabelText('Minute'), '{backspace}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(EMPTY_TIME_VALUE);
  });

  test('does not change when the user modifies the minute input with an invalid value', () => {
    renderTimePicker();

    expect(onChange).not.toHaveBeenCalled();

    userEvent.type(screen.getByLabelText('Minute'), 'a');

    expect(onChange).not.toHaveBeenCalled();
  });

  test('sets the max minute as the new minute value if the hour is the max value and the new minute is above the max minute for 24 hour format', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    const { rerender } = renderTimePicker({ max: '15:30' });

    userEvent.click(screen.getByLabelText('Minute'));

    rerender(<TimePicker data-testid="timePicker" max="15:30" onChange={onChange} value="15:4" />);

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('5');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('15:30');
  });

  test('sets the min minute as the new minute value if the hour is the min value and the new minute is below the min minute for 24 hour format', () => {
    shouldUse12HourFormat.mockImplementation(() => false);

    const { rerender } = renderTimePicker({ min: '15:30' });

    userEvent.click(screen.getByLabelText('Minute'));

    rerender(<TimePicker data-testid="timePicker" min="15:30" onChange={onChange} value="15:1" />);

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('5');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('15:30');
  });

  test('focuses the hour input if the focus is on the minute input and the user presses the left arrow', () => {
    renderTimePicker();

    userEvent.click(screen.getByLabelText('Minute'));
    const hourInput = screen.getByLabelText('Hour');

    expect(hourInput).not.toHaveFocus();

    userEvent.keyboard('[ArrowLeft]');

    expect(hourInput).toHaveFocus();
  });

  test('focuses the time period input if the focus is on the minute input and the user presses the right arrow for 12 hour format', () => {
    renderTimePicker();

    userEvent.click(screen.getByLabelText('Minute'));
    const timePeriodInput = screen.getByLabelText('Time period');

    expect(timePeriodInput).not.toHaveFocus();

    userEvent.keyboard('[ArrowRight]');

    expect(timePeriodInput).toHaveFocus();
  });

  test('focuses the time period input automatically when the user finishes typing a valid minute for 12 hour format', () => {
    const { rerender } = renderTimePicker();

    userEvent.click(screen.getByLabelText('Minute'));
    const timePeriodInput = screen.getByLabelText('Time period');

    expect(timePeriodInput).not.toHaveFocus();

    rerender(<TimePicker data-testid="timePicker" onChange={onChange} value=":1" />);
    userEvent.keyboard('5');

    expect(timePeriodInput).toHaveFocus();
  });

  test('sets the minute to 00 if the input is empty and focused and the user presses the up arrow', () => {
    renderTimePicker();

    userEvent.click(screen.getByLabelText('Minute'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(':00');
  });

  test('sets the minute to 00 if the input has the value 59 and is focused and the user presses the up arrow', () => {
    renderTimePicker({ value: ':59' });

    userEvent.click(screen.getByLabelText('Minute'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(':00');
  });

  test('increments the minute if the input has a valid value and is focused and the user presses the up arrow', () => {
    renderTimePicker({ value: ':20' });

    userEvent.click(screen.getByLabelText('Minute'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(':21');
  });

  test('sets the minute to 59 if the input is empty and focused and the user presses the down arrow', () => {
    renderTimePicker();

    userEvent.click(screen.getByLabelText('Minute'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(':59');
  });

  test('sets the minute to 59 if the input has the value 00 and is focused and the user presses the down arrow', () => {
    renderTimePicker({ value: ':00' });

    userEvent.click(screen.getByLabelText('Minute'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(':59');
  });

  test('decrements the minute if the input has a valid value and is focused and the user presses the down arrow', () => {
    renderTimePicker({ value: ':20' });

    userEvent.click(screen.getByLabelText('Minute'));

    expect(onChange).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(':19');
  });

  test('changes when the user presses the first letter of a valid localized time period', () => {
    const { rerender } = renderTimePicker({ value: '03:00' });

    const timePeriodInput = screen.getByLabelText('Time period');

    expect(onChange).not.toHaveBeenCalled();
    expect(timePeriodInput).toHaveValue('AM');

    userEvent.type(timePeriodInput, 'p');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('15:00');

    rerender(<TimePicker data-testid="timePicker" onChange={onChange} value="15:00" />);

    expect(timePeriodInput).toHaveValue('PM');

    userEvent.type(timePeriodInput, 'a');

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledWith('03:00');

    rerender(<TimePicker data-testid="timePicker" onChange={onChange} value="03:00" />);

    expect(timePeriodInput).toHaveValue('AM');
  });

  test('does not change when the user modifies the time period input with an invalid value', () => {
    renderTimePicker({ value: '03:00' });

    const timePeriodInput = screen.getByLabelText('Time period');

    expect(onChange).not.toHaveBeenCalled();
    expect(timePeriodInput).toHaveValue('AM');

    userEvent.type(timePeriodInput, 'x');

    expect(onChange).not.toHaveBeenCalled();
  });

  test('focuses the minute input if the focus is on the time period input and the user presses the left arrow', () => {
    renderTimePicker();

    userEvent.click(screen.getByLabelText('Time period'));
    const minuteInput = screen.getByLabelText('Minute');

    expect(minuteInput).not.toHaveFocus();

    userEvent.keyboard('[ArrowLeft]');

    expect(minuteInput).toHaveFocus();
  });

  test('switches between the valid time periods if the user presses up or down arrows', () => {
    renderTimePicker();

    const timePeriodInput = screen.getByLabelText('Time period');
    userEvent.click(timePeriodInput);

    expect(timePeriodInput).toHaveValue('AM');

    userEvent.keyboard('[ArrowUp]');

    expect(timePeriodInput).toHaveValue('PM');

    userEvent.keyboard('[ArrowDown]');

    expect(timePeriodInput).toHaveValue('AM');
  });

  test('opens the time options', () => {
    renderTimePicker();

    const openTimeOptionsButton = screen.getByLabelText('Open time options');

    expect(openTimeOptionsButton).toHaveAttribute('aria-expanded', 'false');

    userEvent.click(openTimeOptionsButton);

    expect(screen.getByRole('presentation')).toBeVisible();
    expect(openTimeOptionsButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('closes the calendar', () => {
    renderTimePicker();

    const openTimeOptionsButton = screen.getByLabelText('Open time options');
    userEvent.click(openTimeOptionsButton);
    const timeOptions = screen.getByRole('presentation');

    expect(timeOptions).toBeVisible();
    expect(openTimeOptionsButton).toHaveAttribute('aria-expanded', 'true');

    userEvent.click(openTimeOptionsButton);

    expect(openTimeOptionsButton).toHaveAttribute('aria-expanded', 'false');

    waitFor(() => {
      expect(timeOptions).not.toBeVisible();
    });
  });
});
