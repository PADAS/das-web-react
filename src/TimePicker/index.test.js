import React from 'react';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import TimePicker from '.';
import { addMinutes } from 'date-fns';
import { getUserLocaleTime } from '../utils/datetime';
import { render, screen } from '../test-utils';

describe('TimePicker', () => {
  const onChange = jest.fn();

  const createTimeOptions = (minutesInterval = 30) => {
    const optionsToDisplay = Math.floor ((60 / minutesInterval) * 24);
    const initialTimeDate = new Date();
    initialTimeDate.setHours(0, 0, 0);
    const options = [];
    let accumulatedMinutes = 0;

    while (options.length < optionsToDisplay) {
      const dateWithAccumulation = addMinutes(initialTimeDate, accumulatedMinutes);
      options.push(getUserLocaleTime(dateWithAccumulation));
      accumulatedMinutes += minutesInterval;
    }
    return options;
  };

  const getMinutesDiff = (startDate, endDate) => Math.round(
    ( endDate.getTime() - startDate.getTime() ) / 60000
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('time options should be given in intervals of the value specified by minutesInterval', async () => {
    const minutesInterval = 5;
    render(<TimePicker onChange={onChange} minutesInterval={minutesInterval} value="10:00" />);
    const timeOptions = createTimeOptions(minutesInterval);
    const timeInput = await screen.findByTestId('time-input');
    userEvent.click(timeInput);

    const optionsList = await screen.findByRole('list');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

    timeOptions.forEach((option, index) => {
      expect(timeOptionsListItems[index].textContent).toBe(option);
    });
  });

  test('shows only the duration time in options if showDurationFromMinTime is true', async () => {
    render(<TimePicker onChange={onChange} showDurationFromMinTime minTime="10:00" value="10:00" />);

    const timeInput = await screen.findByTestId('time-input');
    userEvent.click(timeInput);

    const optionsList = await screen.findByRole('list');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');


    expect(timeOptionsListItems[0].textContent.slice(9)).toBe('(-10h)');
    expect(timeOptionsListItems[1].textContent.slice(9)).toBe('(-9h 30m)');
    expect(timeOptionsListItems[2].textContent.slice(9)).toBe('(-9h)');
    expect(timeOptionsListItems[3].textContent.slice(9)).toBe('(-8h 30m)');
    expect(timeOptionsListItems[4].textContent.slice(9)).toBe('(-8h)');
  });

  test('calls onChange and send a date with the time chosen', async () => {
    render(<TimePicker onChange={onChange} value="10:00" />);

    const timeInput = await screen.findByTestId('time-input');
    userEvent.click(timeInput);

    const optionsList = await screen.findByRole('list');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

    expect(onChange).toHaveBeenCalledTimes(0);

    const [timeOption] = timeOptionsListItems;
    userEvent.click(timeOption);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('00:00');
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
    let accumulatedMinutes = 0;
    const minutesInterval = 30;
    const maxTime = '14:00';
    render(<TimePicker maxTime={maxTime} onChange={onChange} value="12:00" minutesInterval={minutesInterval} />);

    const timeInput = await screen.findByTestId('time-input');
    userEvent.click(timeInput);

    expect(onChange).toHaveBeenCalledTimes(0);

    const options = createTimeOptions();
    const optionsList = await screen.findByRole('list');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

    const maxTimeDate = new Date();
    const [hour, minutes] = maxTime.split(':');
    maxTimeDate.setHours(hour, minutes, 0);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0);

    timeOptionsListItems.forEach((timeOption, index) => {
      const option = options[index];
      const currentDisplayHour = timeOption.firstChild.innerHTML;

      expect(currentDisplayHour).toBe(option);

      const dateWithAccumulation = addMinutes(currentDate, accumulatedMinutes);
      const minutesDiff = getMinutesDiff(maxTimeDate, dateWithAccumulation);

      if (minutesDiff > 0){
        expect(timeOption).toHaveClass('disabled');
      } else {
        expect(timeOption).not.toHaveClass('disabled');
      }

      accumulatedMinutes+=minutesInterval;
    });
  });

  test('disables the options that are below maxTime', async () => {
    const minTime = '10:00';
    render(<TimePicker minTime={minTime} onChange={onChange} value="12:00" minutesInterval={30} />);

    const timeInput = await screen.findByTestId('time-input');
    userEvent.click(timeInput);

    expect(onChange).toHaveBeenCalledTimes(0);

    const optionsList = await screen.findByRole('list');
    const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

    expect(timeOptionsListItems[0]).toHaveTextContent('12:00 AM');
    expect(timeOptionsListItems[0]).toHaveClass('disabled');
    expect(timeOptionsListItems[19]).toHaveTextContent('09:30 AM');
    expect(timeOptionsListItems[19]).toHaveClass('disabled');
    expect(timeOptionsListItems[20]).toHaveTextContent('10:00 AM');
    expect(timeOptionsListItems[20]).not.toHaveClass('disabled');
    expect(timeOptionsListItems[21]).toHaveTextContent('10:30 AM');
    expect(timeOptionsListItems[21]).not.toHaveClass('disabled');
  });
});
