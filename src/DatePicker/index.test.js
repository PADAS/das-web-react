import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { within } from '@testing-library/dom';

import DatePicker from './';

describe('DatePicker', () => {
  test('it should render a different placeholder if it is provided', async () => {
    render(<DatePicker placeholderText='hello dumb text' />);

    const customButton = await screen.getByTestId('custom-datepicker-button');
    const placeholderText = within(customButton).queryByText('hello dumb text');

    expect(placeholderText).toBeDefined();
  });

  test('It should call the calendar callbacks for close and open', async () => {
    const onCalendarOpenMock = jest.fn();
    const onCalendarCloseMock = jest.fn();

    render(<DatePicker onCalendarOpen={onCalendarOpenMock} onCalendarClose={onCalendarCloseMock}/>);

    expect(onCalendarOpenMock).toHaveBeenCalledTimes(0);
    expect(onCalendarCloseMock).toHaveBeenCalledTimes(0);

    const customButton = await screen.getByTestId('custom-datepicker-button');
    userEvent.click(customButton);

    expect(onCalendarOpenMock).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape', code: 'Escape' });

    expect(onCalendarCloseMock).toHaveBeenCalledTimes(1);
  });

  test('it should open the calendar if the user clicks the button', async () => {
    render(<DatePicker/>);

    const customButton = await screen.getByTestId('custom-datepicker-button');

    expect(() => screen.getByRole('listbox')).toThrow();

    userEvent.click(customButton);

    expect(() => screen.getByRole('listbox')).toBeDefined();
  });
});
