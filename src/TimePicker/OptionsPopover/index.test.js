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
    id="optionsPopover"
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

  test('focuses the list automatically', async () => {
    renderOptionsPopover();

    expect(screen.getByRole('listbox')).toHaveFocus();
  });

  test('keeps the popover itself out of the tab order', async () => {
    renderOptionsPopover();

    expect(screen.getByRole('presentation')).toHaveAttribute('tabindex', '-1');
  });

  test('matches the width of the target element', async () => {
    renderOptionsPopover({ target: { current: { offsetWidth: 48 } } });

    expect(screen.getByRole('presentation')).toHaveStyle({ width: '48px' });
  });

  test('navigates the options with the arrows', async () => {
    renderOptionsPopover();

    const optionsList = screen.getByRole('listbox');
    const options = screen.getAllByRole('option');

    expect(optionsList).toHaveAttribute('aria-activedescendant', 'optionsPopover-00:00');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');

    await userEvent.keyboard('[ArrowDown]');

    expect(optionsList).toHaveAttribute('aria-activedescendant', 'optionsPopover-00:30');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');

    await userEvent.keyboard('[ArrowDown]');

    expect(optionsList).toHaveAttribute('aria-activedescendant', 'optionsPopover-01:00');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
    expect(options[2]).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('[ArrowUp]');

    expect(optionsList).toHaveAttribute('aria-activedescendant', 'optionsPopover-00:30');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');

    await userEvent.keyboard('[ArrowUp]');

    expect(optionsList).toHaveAttribute('aria-activedescendant', 'optionsPopover-00:00');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');
  });

  test('navigates to the first and the last options with the home and end keys', async () => {
    renderOptionsPopover();

    const options = screen.getAllByRole('option');

    await userEvent.keyboard('{End}');

    expect(screen.getByRole('listbox')).toHaveAttribute('aria-activedescendant', 'optionsPopover-23:30');
    expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{Home}');

    expect(screen.getByRole('listbox')).toHaveAttribute('aria-activedescendant', 'optionsPopover-00:00');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  test('selects the option closest to the current value', async () => {
    renderOptionsPopover({ value: '15:25' });

    const options = screen.getAllByRole('option');

    expect(options[31]).toHaveAttribute('aria-selected', 'true');
  });

  test('selects the option closest to the current value when the min time leaves options out', async () => {
    renderOptionsPopover({ min: '10:00', value: '11:00' });

    const options = screen.getAllByRole('option');

    expect(screen.getByRole('listbox')).toHaveAttribute('aria-activedescendant', 'optionsPopover-11:00');
    expect(options[2]).toHaveAttribute('aria-selected', 'true');
  });

  test('changes to the first option when the user presses enter without navigating the list', async () => {
    renderOptionsPopover();

    await userEvent.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('00:00');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('changes to the option selected by pressing enter', async () => {
    renderOptionsPopover();

    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(optionsPopoverButtonFocus).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowDown]');
    await userEvent.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('00:30');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(optionsPopoverButtonFocus).toHaveBeenCalledTimes(1);
  });

  test('changes to the option selected by pressing space', async () => {
    renderOptionsPopover();

    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(optionsPopoverButtonFocus).not.toHaveBeenCalled();

    await userEvent.keyboard('[ArrowDown]');
    await userEvent.keyboard('[Space]');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('00:30');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(optionsPopoverButtonFocus).toHaveBeenCalledTimes(1);
  });

  test('changes to the option selected by clicking', async () => {
    renderOptionsPopover();

    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(optionsPopoverButtonFocus).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText('12:30 AM'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('00:30');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(optionsPopoverButtonFocus).toHaveBeenCalledTimes(1);
  });

  test('closes the popover when user presses escape and focuses the options popover button', async () => {
    renderOptionsPopover();

    expect(onClose).not.toHaveBeenCalled();
    expect(optionsPopoverButtonFocus).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(optionsPopoverButtonFocus).toHaveBeenCalledTimes(1);
  });

  test('closes the popover and focuses the options popover button when the user presses tab', async () => {
    renderOptionsPopover();

    await userEvent.keyboard('{Tab}');

    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(optionsPopoverButtonFocus).toHaveBeenCalledTimes(1);
  });

  test('closes the popover when user clicks outside of it', async () => {
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

    await userEvent.click(screen.getByTestId('outside'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('sets a custom interval for the options', async () => {
    renderOptionsPopover({ minutesInterval: 15 });

    const options = screen.getAllByRole('option');

    expect(options).toHaveLength(96);
    expect(options[0]).toHaveTextContent('12:00 AM');
    expect(options[1]).toHaveTextContent('12:15 AM');
    expect(options[2]).toHaveTextContent('12:30 AM');
  });

  test('shows the duration ellapsed from the min time', async () => {
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
