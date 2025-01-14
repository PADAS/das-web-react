import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../test-utils';
import { EMPTY_DATE_VALUE } from '../utils';

import CalendarPopper from '.';

describe('DatePicker - CalendarPopper', () => {
  const onChange = jest.fn();
  const setIsOpen = jest.fn();

  const renderCalendarPopper = (props) => render(<CalendarPopper
    disabled={false}
    isOpen={false}
    maxDate={undefined}
    minDate={undefined}
    onChange={onChange}
    readOnly={false}
    setIsOpen={setIsOpen}
    value={EMPTY_DATE_VALUE}
    {...props}
  />);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('does not disable the calendar popper', () => {
    renderCalendarPopper();

    expect(screen.getByLabelText('Open calendar')).not.toBeDisabled();
  });

  test('disables the calendar popper', () => {
    renderCalendarPopper({ disabled: true });

    expect(screen.getByLabelText('Open calendar')).toBeDisabled();
  });

  test('opens the calendar', () => {
    renderCalendarPopper();

    expect(setIsOpen).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Open calendar'));

    expect(setIsOpen).toHaveBeenCalledTimes(1);
    expect(setIsOpen).toHaveBeenCalledWith(true);
  });

  test('closes the calendar by clicking the button', () => {
    renderCalendarPopper({ isOpen: true });

    expect(setIsOpen).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Open calendar'));

    expect(setIsOpen).toHaveBeenCalledTimes(1);
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });

  test('closes the calendar by pressing escape', () => {
    renderCalendarPopper({ isOpen: true });

    expect(setIsOpen).not.toHaveBeenCalled();

    userEvent.keyboard('{escape}');

    expect(setIsOpen).toHaveBeenCalledTimes(1);
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });

  test('changes the date when the user clicks an option from the calendar', () => {
    renderCalendarPopper({ isOpen: true,  value: '2020-01-01' });

    expect(onChange).not.toHaveBeenCalled();
    expect(setIsOpen).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Choose Monday, January 13th, 2020'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('2020-01-13');
    expect(setIsOpen).toHaveBeenCalledTimes(1);
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });
});
