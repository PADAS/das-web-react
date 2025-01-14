import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../../../test-utils';

import MonthPicker from '.';

describe('DatePicker - CalendarPopper - MonthPicker', () => {
  const changeMonth = jest.fn();
  const changeYear = jest.fn();
  const decreaseMonth = jest.fn();
  const decreaseYear = jest.fn();
  const increaseMonth = jest.fn();
  const increaseYear = jest.fn();
  const onKeyDown = jest.fn();

  const renderMonthPicker = (props) => render(<MonthPicker
    changeMonth={changeMonth}
    changeYear={changeYear}
    date={new Date(2020, 0, 1)}
    decreaseMonth={decreaseMonth}
    decreaseYear={decreaseYear}
    increaseMonth={increaseMonth}
    increaseYear={increaseYear}
    nextMonthButtonDisabled={false}
    nextYearButtonDisabled={false}
    onKeyDown={onKeyDown}
    prevMonthButtonDisabled={false}
    prevYearButtonDisabled={false}
    {...props}
  />);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('decreases the year', () => {
    renderMonthPicker();

    expect(decreaseYear).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Previous year'));

    expect(decreaseYear).toHaveBeenCalledTimes(1);
  });

  test('decreases the month', () => {
    renderMonthPicker();

    expect(decreaseMonth).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Previous month'));

    expect(decreaseMonth).toHaveBeenCalledTimes(1);
  });

  test('increases the month', () => {
    renderMonthPicker();

    expect(increaseMonth).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Next month'));

    expect(increaseMonth).toHaveBeenCalledTimes(1);
  });

  test('increases the year', () => {
    renderMonthPicker();

    expect(increaseYear).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Next year'));

    expect(increaseYear).toHaveBeenCalledTimes(1);
  });

  test('opens the month picker', () => {
    renderMonthPicker();

    userEvent.click(screen.getByLabelText('Open month picker'));

    expect(screen.getByLabelText('Choose Date')).toBeVisible();
  });

  test('closes the month picker by clicking the button', () => {
    renderMonthPicker();

    const openMonthPickerButton = screen.getByLabelText('Open month picker');
    userEvent.click(openMonthPickerButton);
    const monthPicker = screen.getByLabelText('Choose Date');

    expect(monthPicker).toBeVisible();

    userEvent.click(openMonthPickerButton);

    expect(monthPicker).not.toBeVisible();
  });

  test('closes the month picker by pressing escape', () => {
    renderMonthPicker();

    userEvent.click(screen.getByLabelText('Open month picker'));
    const monthPicker = screen.getByLabelText('Choose Date');

    expect(monthPicker).toBeVisible();

    userEvent.keyboard('{escape}');

    expect(monthPicker).not.toBeVisible();
  });

  test('decreases the year of the month picker', () => {
    renderMonthPicker();

    userEvent.click(screen.getByLabelText('Open month picker'));
    const monthPickerHeader = screen.getByTestId('datePicker-calendarPopper-monthPicker-header');

    expect(monthPickerHeader).toHaveTextContent('2020');

    userEvent.click(within(monthPickerHeader).getByLabelText('Previous year'));

    expect(monthPickerHeader).toHaveTextContent('2019');
  });

  test('increases the year of the month picker', () => {
    renderMonthPicker();

    userEvent.click(screen.getByLabelText('Open month picker'));
    const monthPickerHeader = screen.getByTestId('datePicker-calendarPopper-monthPicker-header');

    expect(monthPickerHeader).toHaveTextContent('2020');

    userEvent.click(within(monthPickerHeader).getByLabelText('Next year'));

    expect(monthPickerHeader).toHaveTextContent('2021');
  });

  test('changes the date when the user clicks an option from the calendar', () => {
    renderMonthPicker();

    userEvent.click(screen.getByLabelText('Open month picker'));
    const monthPicker = screen.getByLabelText('Choose Date');

    expect(changeMonth).not.toHaveBeenCalled();
    expect(changeYear).not.toHaveBeenCalled();
    expect(monthPicker).toBeVisible();

    userEvent.click(screen.getByLabelText('Choose March 2020'));

    expect(changeMonth).toHaveBeenCalledTimes(1);
    expect(changeMonth).toHaveBeenCalledWith(2);
    expect(changeYear).toHaveBeenCalledTimes(1);
    expect(changeYear).toHaveBeenCalledWith(2020);
    expect(monthPicker).not.toBeVisible();
  });
});
