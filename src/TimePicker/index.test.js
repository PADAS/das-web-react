import React from 'react';
import { render, screen } from '@testing-library/react';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import TimePicker from '.';

const testDate = '2022-05-01T10:00:00';
const testTimeValue = '10:00';

test('rendering without crashing', () => {
  render(<TimePicker />);
});

test('should render only the time after passing a full date', async () => {
  render(<TimePicker timeValue={testTimeValue} dateValue={testDate}/>);

  const timeInput = await screen.findByTestId('time-input');
  expect(timeInput.value).toBe('10:00');
});

test('should show only 5 options after click on the input', async () => {
  render(<TimePicker timeValue={testTimeValue} dateValue={testDate} />);

  const timeInput = await screen.findByTestId('time-input');
  userEvent.click(timeInput);

  const optionsList = await screen.findByRole('list');
  const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');
  expect(timeOptionsListItems.length).toBe(5);
});

test('time options should be given in intervals of 30 minutes', async () => {
  render(<TimePicker timeValue={testTimeValue} dateValue={testDate} />);

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
  render(<TimePicker timeValue={testTimeValue} dateValue={null} starDateRange={'2022-05-10T09:00:00'}/>);

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
  render(<TimePicker starDateRange={testDate} showOptionsDurationFromInitialValue={true} />);

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

  render(<TimePicker timeValue={testTimeValue} dateValue={testDate} onTimeChange={onTimeChange}/>);

  const timeInput = await screen.findByTestId('time-input');
  userEvent.click(timeInput);

  const optionsList = await screen.findByRole('list');
  const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');

  userEvent.click(timeOptionsListItems[0]);

  const expectedValue = new Date('2022-05-01T10:00:00').setHours(10, 30);
  expect(onTimeChange).toHaveBeenCalledWith(new Date(expectedValue));
});

test('should change style for arrow if input is on focus or blur', async () => {
  const onTimeChange = jest.fn();
  render(<TimePicker timeValue={testTimeValue} dateValue={testDate}  onTimeChange={onTimeChange}/>);

  expect(await screen.getByTestId('time-input-triangle-arrow').classList.contains('open')).toBe(false);

  const timeInput = await screen.findByTestId('time-input');
  userEvent.click(timeInput);

  expect(await screen.getByTestId('time-input-triangle-arrow').classList.contains('open')).toBe(true);

  const optionsList = await screen.findByRole('list');
  const timeOptionsListItems = await within(optionsList).findAllByRole('listitem');
  userEvent.click(timeOptionsListItems[0]);

  expect(await screen.getByTestId('time-input-triangle-arrow').classList.contains('open')).toBe(false);
});
