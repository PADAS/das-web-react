import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../test-utils';
import { AM_PERIOD, EMPTY_TIME_VALUE, PM_PERIOD } from '../utils';

import OptionsPopover from '.';

describe('TimePicker - OptionsPopover', () => {
  const onChange = jest.fn();
  const onClose = jest.fn();
  const optionsPopoverButtonFocus = jest.fn();

  const renderOptionsPopover = (props) => render(<OptionsPopover
    className="className"
    internationalizedTimePeriods={{ [AM_PERIOD]: 'AM', [PM_PERIOD]: 'PM' }}
    max={undefined}
    min={undefined}
    minutesInterval={30}
    onChange={onChange}
    onClose={onClose}
    optionsPopoverButtonRef={{
      current: {
        focus: optionsPopoverButtonFocus,
      },
    }}
    showDurationFromMin={false}
    style={{}}
    target={{ current: {} }}
    value={EMPTY_TIME_VALUE}
    {...props}
  />);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('focuses the list automatically', () => {
    renderOptionsPopover();

    expect(screen.getByRole('listbox')).toHaveFocus();
  });

  test('matches the width of the target element', () => {
    renderOptionsPopover({ target: { current: { offsetWidth: 48 } } });

    expect(screen.getByRole('presentation')).toHaveStyle({ width: '48px' });
  });

  test('navigates the options with the arrows', () => {
    renderOptionsPopover();

    const optionsList = screen.getByRole('listbox');
    const options = screen.getAllByRole('option');

    expect(optionsList).toHaveAttribute('aria-activedescendant', '00:00');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');

    userEvent.keyboard('[ArrowDown]');

    expect(optionsList).toHaveAttribute('aria-activedescendant', '00:30');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');

    userEvent.keyboard('[ArrowDown]');

    expect(optionsList).toHaveAttribute('aria-activedescendant', '01:00');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
    expect(options[2]).toHaveAttribute('aria-selected', 'true');

    userEvent.keyboard('[ArrowUp]');

    expect(optionsList).toHaveAttribute('aria-activedescendant', '00:30');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');

    userEvent.keyboard('[ArrowUp]');

    expect(optionsList).toHaveAttribute('aria-activedescendant', '00:00');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');
  });

  test('selects the option closest to the current value', () => {
    renderOptionsPopover({ value: '15:25' });

    const options = screen.getAllByRole('option');

    expect(options[31]).toHaveAttribute('aria-selected', 'true');
  });

  test('changes to the option selected by pressing enter', () => {
    renderOptionsPopover();

    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(optionsPopoverButtonFocus).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowDown]');
    userEvent.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('00:30');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(optionsPopoverButtonFocus).toHaveBeenCalledTimes(1);
  });

  test('changes to the option selected by pressing space', () => {
    renderOptionsPopover();

    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(optionsPopoverButtonFocus).not.toHaveBeenCalled();

    userEvent.keyboard('[ArrowDown]');
    userEvent.keyboard('[Space]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('00:30');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(optionsPopoverButtonFocus).toHaveBeenCalledTimes(1);
  });

  test('changes to the option selected by clicking', () => {
    renderOptionsPopover();

    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(optionsPopoverButtonFocus).not.toHaveBeenCalled();

    userEvent.click(screen.getByText('12:30 AM'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('00:30');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(optionsPopoverButtonFocus).toHaveBeenCalledTimes(1);
  });

  test('closes the popover when user presses escape and focuses the options popover button', () => {
    renderOptionsPopover();

    expect(onClose).not.toHaveBeenCalled();
    expect(optionsPopoverButtonFocus).not.toHaveBeenCalled();

    userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(optionsPopoverButtonFocus).toHaveBeenCalledTimes(1);
  });

  test('closes the popover when user clicks outside of it', () => {
    render(
      <>
        <div data-testid="outside" />

        <OptionsPopover
          className="className"
          internationalizedTimePeriods={{ [AM_PERIOD]: 'AM', [PM_PERIOD]: 'PM' }}
          max={undefined}
          min={undefined}
          minutesInterval={30}
          onChange={onChange}
          onClose={onClose}
          optionsPopoverButtonRef={{ current: { contains: () => false } }}
          showDurationFromMin={false}
          style={{}}
          target={{ current: {} }}
          value={EMPTY_TIME_VALUE}
        />
      </>
    );

    expect(onClose).not.toHaveBeenCalled();

    userEvent.click(screen.getByTestId('outside'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('sets a custom interval for the options', () => {
    renderOptionsPopover({ minutesInterval: 15 });

    const options = screen.getAllByRole('option');

    expect(options).toHaveLength(96);
    expect(options[0]).toHaveTextContent('12:00 AM');
    expect(options[1]).toHaveTextContent('12:15 AM');
    expect(options[2]).toHaveTextContent('12:30 AM');
  });

  test('shows the duration ellapsed from the min time', () => {
    renderOptionsPopover({ min: '12:00', showDurationFromMin: true });

    const options = screen.getAllByRole('option');

    expect(options[0]).toHaveTextContent('12:00 PM');
    expect(options[0]).toHaveTextContent('0m');
    expect(options[1]).toHaveTextContent('12:30 PM');
    expect(options[1]).toHaveTextContent('30m');
    expect(options[2]).toHaveTextContent('01:00 PM');
    expect(options[2]).toHaveTextContent('1h');
  });
});
