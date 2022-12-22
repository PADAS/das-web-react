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

  test('should render only the amount of options specified by optionsToDisplay', async () => {
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

    expect(timeOptionsListItems[0].textContent).toBe('10:05');
    expect(timeOptionsListItems[1].textContent).toBe('10:10');
    expect(timeOptionsListItems[2].textContent).toBe('10:15');
    expect(timeOptionsListItems[3].textContent).toBe('10:20');
    expect(timeOptionsListItems[4].textContent).toBe('10:25');
  });

  test('should show only the duration time in options if showDurationFromStartTime is true', async () => {
    render(<TimePicker onChange={onChange} showDurationFromStartTime value="10:00" />);

    const timeInput = await screen.findByTestId('time-input');
    userEvent.click(timeInput);

    const optionsList = await screen.findByRole('list');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

    expect(timeOptionsListItems[0].textContent).toBe('10:30 (30m)');
    expect(timeOptionsListItems[1].textContent).toBe('11:00 (1h)');
    expect(timeOptionsListItems[2].textContent).toBe('11:30 (1h 30m)');
    expect(timeOptionsListItems[3].textContent).toBe('12:00 (2h)');
    expect(timeOptionsListItems[4].textContent).toBe('12:30 (2h 30m)');
  });

  test('should call onChange and send a date with the time chosen', async () => {
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

  test('should set the arrow as open if input is on focus', async () => {
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
});
