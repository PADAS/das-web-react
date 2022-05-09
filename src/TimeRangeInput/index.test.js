import React from 'react';
import { render, screen } from '@testing-library/react';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import TimeRangeInput from './';

const testDate = 'Sun May 01 2022 10:00:00 GMT-0500 (Central Daylight Time)';

test('rendering without crashing', () => {
  render(<TimeRangeInput />);
});

test('should render only the time after passing a full date', async () => {
  render(<TimeRangeInput dateValue={testDate} />);

  const timeInput = await screen.findByTestId('time-input');
  expect(timeInput.value).toBe('10:00');
});

test('should show only 5 options after click on the input', async () => {
  render(<TimeRangeInput dateValue={testDate} />);

  const timeInput = await screen.findByTestId('time-input');
  userEvent.click(timeInput);

  const optionsList = await screen.findByRole('list');
  const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');
  expect(timeOptionsListItems.length).toBe(5);
});

test('time options should be given in intervals of 30 minutes', async () => {
  render(<TimeRangeInput dateValue={testDate} />);

  const timeInput = await screen.findByTestId('time-input');
  userEvent.click(timeInput);

  const optionsList = await screen.findByRole('list');
  const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

  expect(timeOptionsListItems[0].textContent).toBe('10:30');
  expect(timeOptionsListItems[1].textContent).toBe('11:00');
  expect(timeOptionsListItems[2].textContent).toBe('11:30');
  expect(timeOptionsListItems[3].textContent).toBe('12:00');
  expect(timeOptionsListItems[4].textContent).toBe('12:30');
});

test('if the date value is not provided, it should consider the starDateRange to take the time options', async () => {
  render(<TimeRangeInput dateValue={null} starDateRange={'Tue May 10 2022 09:00:00 GMT-0500 (Central Daylight Time)'}/>);

  const timeInput = await screen.findByTestId('time-input');
  userEvent.click(timeInput);

  const optionsList = await screen.findByRole('list');
  const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

  expect(timeOptionsListItems[0].textContent).toBe('09:30');
  expect(timeOptionsListItems[1].textContent).toBe('10:00');
  expect(timeOptionsListItems[2].textContent).toBe('10:30');
  expect(timeOptionsListItems[3].textContent).toBe('11:00');
  expect(timeOptionsListItems[4].textContent).toBe('11:30');
});

test('should show only the duration time in options if the prop showOptionsDurationFromInitialValue is activated', async () => {
  render(<TimeRangeInput dateValue={testDate} showOptionsDurationFromInitialValue={true} />);

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

test('should call onTimeChange and send a date with the time added', async () => {
  const onTimeChange = jest.fn();

  render(<TimeRangeInput dateValue={testDate} onTimeChange={onTimeChange}/>);

  const timeInput = await screen.findByTestId('time-input');
  userEvent.click(timeInput);

  const optionsList = await screen.findByRole('list');
  const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

  userEvent.click(timeOptionsListItems[0]);

  const expectedValue = new Date('Sun May 01 2022 10:00:00 GMT-0500 (Central Daylight Time)').setHours(10, 30);
  expect(onTimeChange).toHaveBeenCalledWith(new Date(expectedValue));
});
