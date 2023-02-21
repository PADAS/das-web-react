import React from 'react';
import { render, screen } from '@testing-library/react';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import TimePicker from '.';

describe('TimePicker', () => {
  const onChange = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders only the amount of options specified by optionsToDisplay', async () => {
    render(<TimePicker onChange={onChange} optionsToDisplay={15} value="10:00" />);

    const timeInput = await screen.findByTestId('time-input');
    userEvent.click(timeInput);

    const optionsList = await screen.findByRole('list');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

    expect(timeOptionsListItems.length).toBe(15);
  });

  test('time options should be given in intervals of the value specified by minutesInterval starting by the value', async () => {
    render(<TimePicker onChange={onChange} minutesInterval={5} value="10:00" />);

    const timeInput = await screen.findByTestId('time-input');
    userEvent.click(timeInput);

    const optionsList = await screen.findByRole('list');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

    expect(timeOptionsListItems[0].textContent.slice(0, 5)).toBe('10:05');
    expect(timeOptionsListItems[1].textContent.slice(0, 5)).toBe('10:10');
    expect(timeOptionsListItems[2].textContent.slice(0, 5)).toBe('10:15');
    expect(timeOptionsListItems[3].textContent.slice(0, 5)).toBe('10:20');
    expect(timeOptionsListItems[4].textContent.slice(0, 5)).toBe('10:25');
  });

  test('shows only the duration time in options if showDurationFromStartTime is true', async () => {
    render(<TimePicker onChange={onChange} showDurationFromStartTime value="10:00" />);

    const timeInput = await screen.findByTestId('time-input');
    userEvent.click(timeInput);

    const optionsList = await screen.findByRole('list');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

    expect(timeOptionsListItems[0].textContent.slice(9)).toBe('(30m)');
    expect(timeOptionsListItems[1].textContent.slice(9)).toBe('(1h)');
    expect(timeOptionsListItems[2].textContent.slice(9)).toBe('(1h 30m)');
    expect(timeOptionsListItems[3].textContent.slice(9)).toBe('(2h)');
    expect(timeOptionsListItems[4].textContent.slice(9)).toBe('(2h 30m)');
  });

  test('calls onChange and send a date with the time chosen', async () => {
    render(<TimePicker onChange={onChange} value="10:00" />);

    const timeInput = await screen.findByTestId('time-input');
    userEvent.click(timeInput);

    const optionsList = await screen.findByRole('list');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

    expect(onChange).toHaveBeenCalledTimes(0);

    userEvent.click(timeOptionsListItems[2]);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('11:30');
  });

  test('sets the arrow as open if input is on focus', async () => {
    render(<TimePicker onChange={onChange} value="10:00" />);

    expect((await screen.findByTestId('time-input-triangle-arrow'))).not.toHaveClass('open');

    const timeInput = await screen.findByTestId('time-input');
    userEvent.click(timeInput);

    expect((await screen.findByTestId('time-input-triangle-arrow'))).toHaveClass('open');

    const optionsList = await screen.findByRole('list');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');
    userEvent.click(timeOptionsListItems[0]);

    expect((await screen.findByTestId('time-input-triangle-arrow'))).not.toHaveClass('open');
  });

  test('disables the options that are above maxTime', async () => {
    render(<TimePicker maxTime="14:00" onChange={onChange} value="12:00" />);

    const timeInput = await screen.findByTestId('time-input');
    userEvent.click(timeInput);

    expect(onChange).toHaveBeenCalledTimes(0);

    const optionsList = await screen.findByRole('list');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

    expect(timeOptionsListItems[3]).toHaveTextContent('02:00');
    expect(timeOptionsListItems[3]).not.toHaveClass('disabled');
    expect(timeOptionsListItems[4]).toHaveTextContent('02:30');
    expect(timeOptionsListItems[4]).toHaveClass('disabled');

    userEvent.click(timeOptionsListItems[4]);

    expect(onChange).toHaveBeenCalledTimes(0);
  });
});
