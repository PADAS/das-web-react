import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DatePicker from './';

describe('DatePicker', () => {
  const onCalendarOpenMock = jest.fn(), onCalendarCloseMock = jest.fn(), onChangeMock = jest.fn();
  let rerender;
  beforeEach(() => {
    ({ rerender } = render(<DatePicker
      onCalendarOpen={onCalendarOpenMock}
      onCalendarClose={onCalendarCloseMock}
      placeholderText="placeholder text"
    />));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the default placeholder if it is not provided', async () => {
    rerender(<DatePicker onCalendarOpen={onCalendarOpenMock} onCalendarClose={onCalendarCloseMock} />);

    expect((await screen.findByPlaceholderText('YYYY/MM/DD'))).toBeDefined();
  });

  test('renders the placeholder if it is provided', async () => {
    expect((await screen.findByPlaceholderText('placeholder text'))).toBeDefined();
  });

  test('opens and closes the calendar if the user clicks the button', async () => {
    expect(onCalendarOpenMock).toHaveBeenCalledTimes(0);
    expect(onCalendarCloseMock).toHaveBeenCalledTimes(0);

    const datePickerInput = await screen.getByTestId('datePicker-input');

    expect((await screen.queryByRole('listbox'))).toBeNull();

    userEvent.click(datePickerInput);

    expect(onCalendarOpenMock).toHaveBeenCalledTimes(1);
    expect((await screen.findByRole('listbox'))).toBeDefined();

    userEvent.keyboard('{Escape}');

    expect(onCalendarCloseMock).toHaveBeenCalledTimes(1);
    expect((await screen.queryByRole('listbox'))).toBeNull();
  });

  test('decreases one year when clicking double left arrow button', async () => {
    rerender(<DatePicker
      onCalendarOpen={onCalendarOpenMock}
      onCalendarClose={onCalendarCloseMock}
      selected={new Date(2020, 1)}
    />);

    const datePickerInput = await screen.getByTestId('datePicker-input');
    userEvent.click(datePickerInput);

    const decreaseYearButton = await screen.getByTestId('datePicker-decreaseYear');

    expect((await screen.findByText('Feb 2020'))).toBeDefined();

    userEvent.click(decreaseYearButton);

    expect((await screen.findByText('Feb 2019'))).toBeDefined();
  });

  test('decreases one month when clicking left arrow button', async () => {
    rerender(<DatePicker
      onCalendarOpen={onCalendarOpenMock}
      onCalendarClose={onCalendarCloseMock}
      selected={new Date(2020, 1)}
    />);

    const datePickerInput = await screen.getByTestId('datePicker-input');
    userEvent.click(datePickerInput);

    const decreaseMonthButton = await screen.getByTestId('datePicker-decreaseMonth');

    expect((await screen.findByText('Feb 2020'))).toBeDefined();

    userEvent.click(decreaseMonthButton);

    expect((await screen.findByText('Jan 2020'))).toBeDefined();
  });

  test('increases one year when clicking double right arrow button', async () => {
    rerender(<DatePicker
      onCalendarOpen={onCalendarOpenMock}
      onCalendarClose={onCalendarCloseMock}
      selected={new Date(2020, 1)}
    />);

    const datePickerInput = await screen.getByTestId('datePicker-input');
    userEvent.click(datePickerInput);

    const increaseYearButton = await screen.getByTestId('datePicker-increaseYear');

    expect((await screen.findByText('Feb 2020'))).toBeDefined();

    userEvent.click(increaseYearButton);

    expect((await screen.findByText('Feb 2021'))).toBeDefined();
  });

  test('increases one month when clicking right arrow button', async () => {
    rerender(<DatePicker
      onCalendarOpen={onCalendarOpenMock}
      onCalendarClose={onCalendarCloseMock}
      selected={new Date(2020, 1)}
    />);

    const datePickerInput = await screen.getByTestId('datePicker-input');
    userEvent.click(datePickerInput);

    const increaseMonthButton = await screen.getByTestId('datePicker-increaseMonth');

    expect((await screen.findByText('Feb 2020'))).toBeDefined();

    userEvent.click(increaseMonthButton);

    expect((await screen.findByText('Mar 2020'))).toBeDefined();
  });

  test('opens and closes the month / year picker when clicking the input', async () => {
    rerender(<DatePicker
      onCalendarOpen={onCalendarOpenMock}
      onCalendarClose={onCalendarCloseMock}
      selected={new Date(2020, 1)}
    />);

    const datePickerInput = await screen.getByTestId('datePicker-input');
    userEvent.click(datePickerInput);

    expect((await screen.queryByText('2020'))).toBeNull();

    const monthYearPickerInput = await screen.getByTestId('datePicker-monthYearPicker-input');
    userEvent.click(monthYearPickerInput);

    expect((await screen.findByText('2020'))).toBeDefined();

    userEvent.click(monthYearPickerInput);

    expect((await screen.queryByText('2020'))).toBeNull();
  });

  test('triggers onChange with the selected date', async () => {
    rerender(<DatePicker
      onCalendarOpen={onCalendarOpenMock}
      onCalendarClose={onCalendarCloseMock}
      onChange={onChangeMock}
      selected={new Date(2020, 1)}
    />);

    const datePickerInput = await screen.findByTestId('datePicker-input');
    userEvent.click(datePickerInput);

    expect(onChangeMock).toHaveBeenCalledTimes(0);

    const options = await screen.findAllByRole('option');
    userEvent.click(options[16]);

    expect(onChangeMock).toHaveBeenCalledTimes(1);
    expect(onChangeMock.mock.calls[0][0].toISOString()).toMatch(/^2020-02-11/);
  });
});
