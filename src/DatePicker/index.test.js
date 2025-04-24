import React from 'react';
import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen } from '../test-utils';

import DatePicker, { EMPTY_DATE_VALUE } from '.';

describe('DatePicker', () => {
  const onChange = jest.fn();

  const renderDatePicker = (props) => render(<DatePicker
    data-testid="datePicker"
    onChange={onChange}
    value={EMPTY_DATE_VALUE}
    {...props}
  />);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('adds a custom class name', async () => {
    renderDatePicker({ className: 'className' });

    expect(screen.getByTestId('datePicker')).toHaveClass('className');
  });

  test('sets the default date separator', async () => {
    renderDatePicker();

    const dateSeparators = screen.getAllByText('/');

    expect(dateSeparators).toHaveLength(2);
    expect(dateSeparators[0]).toHaveClass('dateSeparator');
    expect(dateSeparators[1]).toHaveClass('dateSeparator');
  });

  test('sets a custom date separator', async () => {
    renderDatePicker({ dateSeparator: '-' });

    const dateSeparators = screen.getAllByText('-');

    expect(dateSeparators).toHaveLength(2);
    expect(dateSeparators[0]).toHaveClass('dateSeparator');
    expect(dateSeparators[1]).toHaveClass('dateSeparator');
  });

  test('does not disable the date picker', async () => {
    renderDatePicker();

    const datePicker = screen.getByTestId('datePicker');

    expect(datePicker).not.toHaveClass('disabled');
    expect(screen.getByLabelText('Year')).not.toBeDisabled();
    expect(screen.getByLabelText('Month')).not.toBeDisabled();
    expect(screen.getByLabelText('Day')).not.toBeDisabled();
    expect(screen.getByLabelText('Open calendar')).not.toBeDisabled();
  });

  test('disables the date picker', async () => {
    renderDatePicker({ disabled: true });

    const datePicker = screen.getByTestId('datePicker');

    expect(datePicker).toHaveClass('disabled');
    expect(screen.getByLabelText('Year')).toBeDisabled();
    expect(screen.getByLabelText('Month')).toBeDisabled();
    expect(screen.getByLabelText('Day')).toBeDisabled();
    expect(screen.getByLabelText('Open calendar')).toBeDisabled();
  });

  test('sets the name to an input with the date picker value', async () => {
    renderDatePicker({ name: 'date-picker-name', value: '2020-01-01' });

    const datePickerInput = screen.getByTestId('datePicker-input');

    expect(datePickerInput).toHaveAttribute('name', 'date-picker-name');
    expect(datePickerInput).toHaveValue('2020-01-01');
  });

  test('blurs the date picker', async () => {
    const onBlur = jest.fn();

    renderDatePicker({ onBlur });

    const datePicker = screen.getByTestId('datePicker');
    await userEvent.click(datePicker);

    expect(onBlur).not.toHaveBeenCalled();

    fireEvent.blur(datePicker);

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test('focuses the date picker when focusing one of the inner elements', async () => {
    const onFocus = jest.fn();

    renderDatePicker({ onFocus });

    expect(onFocus).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Year'));

    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  test('does not set the date picker as read only', async () => {
    renderDatePicker();

    expect(screen.getByLabelText('Year')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('Month')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('Day')).not.toHaveAttribute('readonly');
    expect(screen.getByLabelText('Open calendar')).not.toBeDisabled();
  });

  test('sets the date picker as read only', async () => {
    renderDatePicker({ readOnly: true, value: '2020-01-01' });

    const yearInput = screen.getByLabelText('Year');
    const montInput = screen.getByLabelText('Month');
    const dayInput = screen.getByLabelText('Day');

    expect(yearInput).toHaveAttribute('readonly');
    expect(montInput).toHaveAttribute('readonly');
    expect(dayInput).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Open calendar')).toBeDisabled();

    await userEvent.click(yearInput);
    await userEvent.keyboard('[ArrowDown]');
    await userEvent.keyboard('[ArrowUp]');

    await userEvent.click(montInput);
    await userEvent.keyboard('[ArrowDown]');
    await userEvent.keyboard('[ArrowUp]');

    await userEvent.click(dayInput);
    await userEvent.keyboard('[ArrowDown]');
    await userEvent.keyboard('[ArrowUp]');

    expect(onChange).not.toHaveBeenCalled();
  });

  test('does not set the date picker as required', async () => {
    renderDatePicker();

    expect(screen.getByLabelText('Year')).not.toBeRequired();
    expect(screen.getByLabelText('Month')).not.toBeRequired();
    expect(screen.getByLabelText('Day')).not.toBeRequired();
  });

  test('sets the date picker as required', async () => {
    renderDatePicker({ required: true });

    expect(screen.getByLabelText('Year')).toBeRequired();
    expect(screen.getByLabelText('Month')).toBeRequired();
    expect(screen.getByLabelText('Day')).toBeRequired();
  });

  test('changes when the user modifies the year input with a valid value', async () => {
    renderDatePicker();

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Year'), '2');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2--');
  });

  test('changes when the user clears the year input', async () => {
    renderDatePicker({ value: '2--' });

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Year'), '{backspace}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(EMPTY_DATE_VALUE);
  });

  test('does not change when the user modifies the year input with an invalid value', async () => {
    renderDatePicker();

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Year'), 'a');

    expect(onChange).not.toHaveBeenCalled();
  });

  test('sets the max year as the new year value if the new year is over the max year', async () => {
    const { rerender } = renderDatePicker({ max: '2021-06-01' });

    await userEvent.click(screen.getByLabelText('Year'));

    rerender(<DatePicker
      data-testid="datePicker"
      max="2021-06-01"
      onChange={onChange}
      value="202--"
    />);

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('2');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2021--');
  });

  test('sets the max month as the new month value if the new year is the max year and the old month was above the max month', async () => {
    const { rerender } = renderDatePicker({ max: '2021-06-01' });

    await userEvent.click(screen.getByLabelText('Year'));

    rerender(<DatePicker
      data-testid="datePicker"
      max="2021-06-01"
      onChange={onChange}
      value="202-08-"
    />);

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('1');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2021-06-');
  });

  test('sets the max day as the new day value if the new year and month are the max values and the old day was above the max day', async () => {
    const { rerender } = renderDatePicker({ max: '2021-06-01' });

    await userEvent.click(screen.getByLabelText('Year'));

    rerender(<DatePicker
      data-testid="datePicker"
      max="2021-06-01"
      onChange={onChange}
      value="202-06-15"
    />);

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('1');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2021-06-01');
  });

  test('sets the min year as the new year value if the new year is below the min year', async () => {
    const { rerender } = renderDatePicker({ min: '2021-06-01' });

    await userEvent.click(screen.getByLabelText('Year'));

    rerender(<DatePicker
      data-testid="datePicker"
      min="2021-06-01"
      onChange={onChange}
      value="202--"
    />);

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('0');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2021--');
  });

  test('sets the min month as the new month value if the new year is the min year and the old month was below the min month', async () => {
    const { rerender } = renderDatePicker({ min: '2021-06-01' });

    await userEvent.click(screen.getByLabelText('Year'));

    rerender(<DatePicker
      data-testid="datePicker"
      min="2021-06-01"
      onChange={onChange}
      value="202-04-"
    />);

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('1');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2021-06-');
  });

  test('sets the min day as the new day value if the new year and month are the min values and the old day was below the min day', async () => {
    const { rerender } = renderDatePicker({ min: '2021-06-05' });

    await userEvent.click(screen.getByLabelText('Year'));

    rerender(<DatePicker
      data-testid="datePicker"
      min="2021-06-05"
      onChange={onChange}
      value="202-06-03"
    />);

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('1');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2021-06-05');
  });

  test('focuses the month input if the focus is on the year input and the user presses the right arrow', async () => {
    renderDatePicker();

    await userEvent.click(screen.getByLabelText('Year'));
    const monthInput = screen.getByLabelText('Month');

    expect(monthInput).not.toHaveFocus();

    await userEvent.keyboard('[ArrowRight]');

    expect(monthInput).toHaveFocus();
  });

  test('focuses the month input automatically when the user finishes typing a valid year', async () => {
    const { rerender } = renderDatePicker();

    await userEvent.click(screen.getByLabelText('Year'));
    const monthInput = screen.getByLabelText('Month');

    expect(monthInput).not.toHaveFocus();

    rerender(<DatePicker data-testid="datePicker" onChange={onChange} value="202--" />);
    await userEvent.keyboard('0');

    expect(monthInput).toHaveFocus();
  });

  test('does not increment the year when the user presses the up arrow if the input is empty', async () => {
    renderDatePicker();

    await userEvent.click(screen.getByLabelText('Year'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowUp]');

    expect(onChange).not.toHaveBeenCalled();
  });

  test('does not increment the year when the user presses the up arrow if the input is 9999', async () => {
    renderDatePicker({ value: '9999-' });

    await userEvent.click(screen.getByLabelText('Year'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowUp]');

    expect(onChange).not.toHaveBeenCalled();
  });

  test('increments the year if the input has a valid value and is focused and the user presses the up arrow', async () => {
    renderDatePicker({ value: '2020--' });

    await userEvent.click(screen.getByLabelText('Year'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2021--');
  });

  test('does not decrement the year when the user presses the down arrow if the input is empty', async () => {
    renderDatePicker();

    await userEvent.click(screen.getByLabelText('Year'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowDown]');

    expect(onChange).not.toHaveBeenCalled();
  });

  test('does not decrement the year when the user presses the down arrow if the input is 0', async () => {
    renderDatePicker({ value: '0-' });

    await userEvent.click(screen.getByLabelText('Year'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowDown]');

    expect(onChange).not.toHaveBeenCalled();
  });

  test('decrements the year if the input has a valid value and is focused and the user presses the down arrow', async () => {
    renderDatePicker({ value: '2020--' });

    await userEvent.click(screen.getByLabelText('Year'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2019--');
  });

  test('autofills the first digit when the user modifies the month input with a number over 1', async () => {
    renderDatePicker();

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Month'), '2');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('-02-');
  });

  test('autofills the first digit when the month input is blurred and it has a digit below 2', async () => {
    renderDatePicker({ value: '-1-' });

    expect(onChange).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText('Month'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('-01-');
  });

  test('does not autofill the first digit when the month input is blurred and it has a digit below 2 if the field is readonly', async () => {
    renderDatePicker({ readOnly: true, value: '-1-' });

    fireEvent.blur(screen.getByLabelText('Month'));

    expect(onChange).not.toHaveBeenCalled();
  });

  test('changes when the user modifies the month input with a valid value', async () => {
    renderDatePicker();

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Month'), '1');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('-1-');
  });

  test('changes when the user clears the month input', async () => {
    renderDatePicker({ value: '-1-' });

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Month'), '{backspace}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(EMPTY_DATE_VALUE);
  });

  test('does not change when the user modifies the month input with an invalid value', async () => {
    renderDatePicker();

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Month'), 'a');

    expect(onChange).not.toHaveBeenCalled();
  });

  test('sets the max month as the new month value if the year is the max year and the new month is above the max month', async () => {
    const { rerender } = renderDatePicker({ max: '2021-06-01' });

    await userEvent.click(screen.getByLabelText('Month'));

    rerender(<DatePicker
      data-testid="datePicker"
      max="2021-06-01"
      onChange={onChange}
      value="2021-0-"
    />);

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('8');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2021-06-');
  });

  test('sets the max day as the new day value if the year and new month are the max values and the old day was above the max day', async () => {
    const { rerender } = renderDatePicker({ max: '2021-06-01' });

    await userEvent.click(screen.getByLabelText('Month'));

    rerender(<DatePicker
      data-testid="datePicker"
      max="2021-06-01"
      onChange={onChange}
      value="2021-0-15"
    />);

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('6');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2021-06-01');
  });

  test('sets the min month as the new month value if the year is the min year and the new month is below the min month', async () => {
    const { rerender } = renderDatePicker({ min: '2021-06-01' });

    await userEvent.click(screen.getByLabelText('Month'));

    rerender(<DatePicker
      data-testid="datePicker"
      min="2021-06-01"
      onChange={onChange}
      value="2021-0-"
    />);

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('4');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2021-06-');
  });

  test('sets the min day as the new day value if the year and new month are the min values and the old day was below the min day', async () => {
    const { rerender } = renderDatePicker({ min: '2021-06-05' });

    await userEvent.click(screen.getByLabelText('Month'));

    rerender(<DatePicker
      data-testid="datePicker"
      min="2021-06-05"
      onChange={onChange}
      value="2021-0-03"
    />);

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('6');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2021-06-05');
  });

  test('focuses the day input if the focus is on the month input and the user presses the right arrow', async () => {
    renderDatePicker();

    await userEvent.click(screen.getByLabelText('Month'));
    const dayInput = screen.getByLabelText('Day');

    expect(dayInput).not.toHaveFocus();

    await userEvent.keyboard('[ArrowRight]');

    expect(dayInput).toHaveFocus();
  });

  test('focuses the year input if the focus is on the month input and the user presses the left arrow', async () => {
    renderDatePicker();

    await userEvent.click(screen.getByLabelText('Month'));
    const yearInput = screen.getByLabelText('Year');

    expect(yearInput).not.toHaveFocus();

    await userEvent.keyboard('[ArrowLeft]');

    expect(yearInput).toHaveFocus();
  });

  test('focuses the day input automatically when the user finishes typing a valid month', async () => {
    const { rerender } = renderDatePicker();

    await userEvent.click(screen.getByLabelText('Month'));
    const dayInput = screen.getByLabelText('Day');

    expect(dayInput).not.toHaveFocus();

    rerender(<DatePicker data-testid="datePicker" onChange={onChange} value="-1-" />);
    await userEvent.keyboard('2');

    expect(dayInput).toHaveFocus();
  });

  test('sets the month to 01 if the input is empty and focused and the user presses the up arrow', async () => {
    renderDatePicker();

    await userEvent.click(screen.getByLabelText('Month'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('-01-');
  });

  test('sets the month to 01 if the input has the value 12 and is focused and the user presses the up arrow', async () => {
    renderDatePicker({ value: '-12-' });

    await userEvent.click(screen.getByLabelText('Month'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('-01-');
  });

  test('increments the month if the input has a valid value and is focused and the user presses the up arrow', async () => {
    renderDatePicker({ value: '-05-' });

    await userEvent.click(screen.getByLabelText('Month'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('-06-');
  });

  test('sets the month to 12 if the input is empty and focused and the user presses the down arrow', async () => {
    renderDatePicker();

    await userEvent.click(screen.getByLabelText('Month'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('-12-');
  });

  test('sets the month to 12 if the input has the value 01 and is focused and the user presses the down arrow', async () => {
    renderDatePicker({ value: '-01-' });

    await userEvent.click(screen.getByLabelText('Month'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('-12-');
  });

  test('decrements the month if the input has a valid value and is focused and the user presses the down arrow', async () => {
    renderDatePicker({ value: '-05-' });

    await userEvent.click(screen.getByLabelText('Month'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('-04-');
  });

  test('autofills the first digit when the user modifies the day input with a number over 3', async () => {
    renderDatePicker();

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Day'), '4');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('--04');
  });

  test('autofills the first digit when the day input is blurred and it has a digit below 4', async () => {
    renderDatePicker({ value: '--3' });

    expect(onChange).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText('Day'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('--03');
  });

  test('does not autofill the first digit when the day input is blurred and it has a digit below 4 if the field is readonly', async () => {
    renderDatePicker({ readOnly: true, value: '--3' });

    fireEvent.blur(screen.getByLabelText('Day'));

    expect(onChange).not.toHaveBeenCalled();
  });

  test('changes when the user modifies the day input with a valid value', async () => {
    renderDatePicker();

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Day'), '1');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('--1');
  });

  test('changes when the user clears the day input', async () => {
    renderDatePicker({ value: '--1' });

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Day'), '{backspace}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(EMPTY_DATE_VALUE);
  });

  test('does not change when the user modifies the day input with an invalid value', async () => {
    renderDatePicker();

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Day'), 'a');

    expect(onChange).not.toHaveBeenCalled();
  });

  test('sets the max day as the new day value if the year and month are the max values and the new day is above the max day', async () => {
    const { rerender } = renderDatePicker({ max: '2021-06-01' });

    await userEvent.click(screen.getByLabelText('Day'));

    rerender(<DatePicker
      data-testid="datePicker"
      max="2021-06-01"
      onChange={onChange}
      value="2021-06-0"
    />);

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('3');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2021-06-01');
  });

  test('sets the min day as the new day value if the year and month are the min values and the new day is below the min day', async () => {
    const { rerender } = renderDatePicker({ min: '2021-06-05' });

    await userEvent.click(screen.getByLabelText('Day'));

    rerender(<DatePicker
      data-testid="datePicker"
      min="2021-06-05"
      onChange={onChange}
      value="2021-06-0"
    />);

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('3');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2021-06-05');
  });

  test('focuses the month input if the focus is on the day input and the user presses the left arrow', async () => {
    renderDatePicker();

    await userEvent.click(screen.getByLabelText('Day'));
    const monthInput = screen.getByLabelText('Month');

    expect(monthInput).not.toHaveFocus();

    await userEvent.keyboard('[ArrowLeft]');

    expect(monthInput).toHaveFocus();
  });

  test('sets the day to 01 if the input is empty and focused and the user presses the up arrow', async () => {
    renderDatePicker();

    await userEvent.click(screen.getByLabelText('Day'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('--01');
  });

  test('sets the day to 01 if the year and month are not valid and the day input has the value 31 and is focused and the user presses the up arrow', async () => {
    renderDatePicker({ value: '--31' });

    await userEvent.click(screen.getByLabelText('Day'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('--01');
  });

  test('sets the day to 01 if the year and month are valid and the day input has the last valid day of the month and is focused and the user presses the up arrow', async () => {
    renderDatePicker({ value: '2020-02-29' });

    await userEvent.click(screen.getByLabelText('Day'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2020-02-01');
  });

  test('increments the day if the input has a valid value and is focused and the user presses the up arrow', async () => {
    renderDatePicker({ value: '--18' });

    await userEvent.click(screen.getByLabelText('Day'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowUp]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('--19');
  });

  test('sets the day to 31 if the input is empty and focused and the user presses the down arrow', async () => {
    renderDatePicker();

    await userEvent.click(screen.getByLabelText('Day'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('--31');
  });

  test('sets the day to 31 if the year and month are not valid and the day input has the value 01 and is focused and the user presses the down arrow', async () => {
    renderDatePicker({ value: '--01' });

    await userEvent.click(screen.getByLabelText('Day'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('--31');
  });

  test('sets the day to the last valid day of the month if the year and month are valid and the day input has the value 01 and is focused and the user presses the down arrow', async () => {
    renderDatePicker({ value: '2020-02-01' });

    await userEvent.click(screen.getByLabelText('Day'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2020-02-29');
  });

  test('decrements the day if the input has a valid value and is focused and the user presses the down arrow', async () => {
    renderDatePicker({ value: '--18' });

    await userEvent.click(screen.getByLabelText('Day'));

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowDown]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('--17');
  });

  test('opens the calendar', async () => {
    renderDatePicker();

    await userEvent.click(screen.getByLabelText('Open calendar'));

    expect(screen.getByLabelText('Choose Date')).toBeVisible();
  });

  test('closes the calendar', async () => {
    renderDatePicker();

    const openCalendarButton = screen.getByLabelText('Open calendar');
    await userEvent.click(openCalendarButton);
    const calendar = screen.getByLabelText('Choose Date');

    expect(calendar).toBeVisible();

    await userEvent.click(openCalendarButton);

    expect(calendar).not.toBeVisible();
  });
});
