import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import DatePicker from './';

test('rendering without crashing', () => {
  render(<DatePicker />);
});

describe('Default Datepicker', () => {

  test('It should NOT render custom input if the prop disableCustomInput is activated', () => {
    render(<DatePicker disableCustomInput={true}/>);
    expect(() => screen.getByTestId('custom-datepicker-button')).toThrow();
  });

  test('it should render a different placeholder if is provided', async () => {
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

    // closing datepicker with escape
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape', code: 'Escape' });

    expect(onCalendarCloseMock).toHaveBeenCalledTimes(1);
  });
});

describe('Custom Datepicker', () => {

  test('It should render the custom input as default', () => {
    render(<DatePicker disableCustomInput={true}/>);
    expect(() => screen.getByTestId('custom-datepicker-button'));
  });

  test('it should open the calendar if the user clicks on the custom button', async () => {
    render(<DatePicker/>);

    const customButton = await screen.getByTestId('custom-datepicker-button');

    expect(() => screen.getByRole('listbox')).toThrow();

    userEvent.click(customButton);

    expect(() => screen.getByRole('listbox')).toBeDefined();
  });
});
