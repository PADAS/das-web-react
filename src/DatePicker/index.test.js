import React from 'react';
import { render, screen } from '@testing-library/react';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import DatePicker from './';

test('rendering without crashing', () => {
  render(<DatePicker />);
});

test('It should render default custom input', () => {
  render(<DatePicker disableCustomInput={true}/>);
  expect(() => screen.getByTestId('custom-datepicker-button'));
});

test('It should NOT render default custom input if the prop disableCustomInput is activated', () => {
  render(<DatePicker disableCustomInput={true}/>);
  expect(() => screen.getByTestId('custom-datepicker-button')).toThrow();
});

test('it should render a different placeholder if is provided', async () => {
  render(<DatePicker placeholderText='hello dumb text' />);

  const customButton = await screen.getByTestId('custom-datepicker-button');
  const placeholderText = within(customButton).queryByText('hello dumb text');
  expect(placeholderText).toBeDefined();
});

test('it should open the calendar if the user clicks on the custom button', async () => {
  render(<DatePicker/>);

  const customButton = await screen.getByTestId('custom-datepicker-button');

  expect(() => screen.getByRole('listbox')).toThrow();

  userEvent.click(customButton);

  expect(() => screen.getByRole('listbox')).toBeDefined();
});
