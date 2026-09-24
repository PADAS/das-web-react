import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { addDays, addYears, subSeconds, subYears } from 'date-fns';
import userEvent from '@testing-library/user-event';

import {
  generateDaysAgoDate,
  generateMonthsAgoDate,
  generateWeeksAgoDate,
} from '../../../../../utils/datetime';
import { INITIAL_FILTER_STATE } from '../../../../../ducks/event-filter';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { render, screen, within } from '../../../../../test-utils';
import { resetGlobalDateRange, updateGlobalDateRange } from '../../../../../ducks/global-date-range';
import { TrackerContext } from '../../../../../utils/analytics';

import DateRangePopover from './';

jest.mock('../../../../../ducks/global-date-range', () => ({
  __esModule: true,
  ...jest.requireActual('../../../../../ducks/global-date-range'),
  resetGlobalDateRange: jest.fn(),
  updateGlobalDateRange: jest.fn(),
}));

describe('SideBar - EventsManager - EventsFeed - Filters - DateRangePopover', () => {
  let onClose, store, track;

  beforeEach(() => {
    onClose = jest.fn();
    track = jest.fn();
    resetGlobalDateRange.mockImplementation(() => () => {});
    updateGlobalDateRange.mockImplementation(() => () => {});

    store = { data: { eventFilter: { filter: { date_range: { ...INITIAL_FILTER_STATE.filter.date_range } } } } };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const DateRangePopoverWithTrigger = () => {
    const [trigger, setTrigger] = useState(null);

    return <>
      <button ref={setTrigger} type="button">Dates</button>

      <button type="button">Outside</button>

      {!!trigger && <DateRangePopover onClose={onClose} trigger={trigger} />}
    </>;
  };

  const renderDateRangePopover = () => render(
    <Provider store={mockStore(store)}>
      <TrackerContext.Provider value={{ track }}>
        <DateRangePopoverWithTrigger />
      </TrackerContext.Provider>
    </Provider>
  );

  const getDateInput = (dateFieldName, segmentName) => within(screen.getByRole('group', { name: dateFieldName }))
    .getByRole('textbox', { name: segmentName });

  test('opens as a modal dialog named after the date range', () => {
    renderDateRangePopover();

    expect(screen.getByRole('dialog', { name: 'Date Range' })).toHaveAttribute('aria-modal', 'true');
  });

  test('focuses itself rather than a field when it opens', () => {
    renderDateRangePopover();

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  test('keeps focus off its reset button when it opens with the date range modified', () => {
    store.data.eventFilter.filter.date_range.upper = addDays(new Date(), 1).toISOString();

    renderDateRangePopover();

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  test('moves focus from its last preset back to the first field when the user tabs past it', async () => {
    renderDateRangePopover();

    screen.getByRole('button', { name: 'Last 3 months' }).focus();

    await userEvent.tab();

    expect(getDateInput('From', 'Year')).toHaveFocus();
  });

  test('closes and returns focus to its trigger when the user presses escape', async () => {
    renderDateRangePopover();

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Dates' })).toHaveFocus();
  });

  test('stays open when the escape the user presses only closes a calendar', async () => {
    renderDateRangePopover();

    const calendarButton = within(screen.getByRole('group', { name: 'From' }))
      .getByRole('button', { name: 'Open calendar' });

    await userEvent.click(calendarButton);

    expect(calendarButton).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Escape}');

    expect(calendarButton).toHaveAttribute('aria-expanded', 'false');
    expect(onClose).not.toHaveBeenCalled();
  });

  test('closes when the user clicks outside it', async () => {
    renderDateRangePopover();

    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('describes the date range in words', () => {
    store.data.eventFilter.filter.date_range = {
      lower: subYears(new Date(), 3).toISOString(),
      upper: subYears(new Date(), 2).toISOString(),
    };

    renderDateRangePopover();

    expect(screen.getByText('about 3 years ago until about 2 years ago')).toBeVisible();
  });

  test('labels the start and end date fields', () => {
    renderDateRangePopover();

    expect(screen.getByRole('group', { name: 'From' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'To' })).toBeInTheDocument();
  });

  test('shows a range with no end as running until now, with an empty end date', () => {
    store.data.eventFilter.filter.date_range = { lower: subYears(new Date(), 3).toISOString(), upper: null };

    renderDateRangePopover();

    expect(screen.getByText('about 3 years ago until now')).toBeVisible();
    expect(getDateInput('To', 'Year')).toHaveValue('');
  });

  test('describes an empty end date as now', () => {
    store.data.eventFilter.filter.date_range = { lower: subYears(new Date(), 3).toISOString(), upper: null };

    renderDateRangePopover();

    expect(screen.getByRole('group', { name: 'To' })).toHaveAccessibleDescription('Now');
  });

  test('leaves the end open again when the user clears the end date', async () => {
    store.data.eventFilter.filter.date_range = {
      lower: subYears(new Date(), 3).toISOString(),
      upper: subYears(new Date(), 2).toISOString(),
    };

    renderDateRangePopover();

    await userEvent.clear(getDateInput('To', 'Year'));
    await userEvent.clear(getDateInput('To', 'Month'));
    await userEvent.clear(getDateInput('To', 'Day'));

    expect(updateGlobalDateRange).toHaveBeenLastCalledWith({ ...store.data.eventFilter.filter.date_range, upper: null });
    expect(track).toHaveBeenCalledWith('Clear end date filter');
  });

  test('does not describe an end date that is set as now', () => {
    store.data.eventFilter.filter.date_range = {
      lower: subYears(new Date(), 3).toISOString(),
      upper: subYears(new Date(), 2).toISOString(),
    };

    renderDateRangePopover();

    expect(screen.getByRole('group', { name: 'To' })).not.toHaveAccessibleDescription();
    expect(screen.queryByText('Now')).toBeNull();
  });

  test('does not offer to reset the date range while it is at its default', () => {
    renderDateRangePopover();

    expect(screen.queryByRole('button', { name: 'Reset date filters' })).toBeNull();
  });

  test('offers to reset the date range once it is modified', () => {
    store.data.eventFilter.filter.date_range.upper = addDays(new Date(), 1).toISOString();

    renderDateRangePopover();

    expect(screen.getByRole('button', { name: 'Reset date filters' })).toBeVisible();
  });

  test('resets the date range, staying open and focused, when the user clicks the reset button', async () => {
    store.data.eventFilter.filter.date_range.upper = addDays(new Date(), 1).toISOString();

    renderDateRangePopover();

    await userEvent.click(screen.getByRole('button', { name: 'Reset date filters' }));

    expect(resetGlobalDateRange).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('Click reset date filters');
    expect(screen.getByRole('dialog')).toHaveFocus();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('moves the start of the range when the user changes the start date', async () => {
    store.data.eventFilter.filter.date_range = {
      lower: new Date(2025, 0, 15).toISOString(),
      upper: new Date(2025, 0, 20).toISOString(),
    };

    renderDateRangePopover();

    getDateInput('From', 'Year').focus();

    await userEvent.keyboard('{ArrowDown}');

    expect(updateGlobalDateRange).toHaveBeenCalledWith({
      lower: new Date(2024, 0, 15).toISOString(),
      upper: new Date(2025, 0, 20).toISOString(),
    });
    expect(track).toHaveBeenCalledWith('Change start date filter');
  });

  test('moves the end of the range when the user changes the end date', async () => {
    store.data.eventFilter.filter.date_range = {
      lower: new Date(2025, 0, 15).toISOString(),
      upper: new Date(2025, 0, 20).toISOString(),
    };

    renderDateRangePopover();

    getDateInput('To', 'Year').focus();

    await userEvent.keyboard('{ArrowUp}');

    expect(updateGlobalDateRange).toHaveBeenCalledWith({
      lower: new Date(2025, 0, 15).toISOString(),
      upper: addYears(new Date(2025, 0, 20), 1).toISOString(),
    });
    expect(track).toHaveBeenCalledWith('Change end date filter');
  });

  test('leaves a start date that does not exist unapplied and marked invalid', async () => {
    store.data.eventFilter.filter.date_range = {
      lower: new Date(2025, 0, 31).toISOString(),
      upper: new Date(2025, 5, 1).toISOString(),
    };

    renderDateRangePopover();

    getDateInput('From', 'Month').focus();

    await userEvent.keyboard('{ArrowUp}');

    expect(getDateInput('From', 'Month')).toHaveValue('02');
    expect(updateGlobalDateRange).not.toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'From' })).toHaveAttribute('aria-invalid', 'true');
  });

  test('keeps a start date that does not exist when the user changes the end date', async () => {
    store.data.eventFilter.filter.date_range = {
      lower: new Date(2025, 0, 31).toISOString(),
      upper: new Date(2025, 5, 1).toISOString(),
    };

    renderDateRangePopover();

    getDateInput('From', 'Month').focus();

    await userEvent.keyboard('{ArrowUp}');

    getDateInput('To', 'Year').focus();

    await userEvent.keyboard('{ArrowUp}');

    expect(getDateInput('From', 'Month')).toHaveValue('02');
    expect(screen.getByRole('group', { name: 'From' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('group', { name: 'To' })).toHaveAttribute('aria-invalid', 'false');
  });

  test.each([
    ['Today', generateDaysAgoDate(0)],
    ['Last 7 days', generateWeeksAgoDate(1)],
    ['Last 30 days', generateDaysAgoDate(30)],
    ['Last 3 months', generateMonthsAgoDate(3)],
  ])('leaves the end of the %s preset open, so it keeps taking new events', async (presetName, expectedLower) => {
    renderDateRangePopover();

    await userEvent.click(screen.getByRole('button', { name: presetName }));

    expect(updateGlobalDateRange).toHaveBeenCalledWith({ lower: expectedLower.toISOString(), upper: null });
  });

  test('starts a preset from the day it is picked on, even after the day the app loaded', async () => {
    jest.useFakeTimers().setSystemTime(addDays(new Date(), 1));
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    renderDateRangePopover();

    await user.click(screen.getByRole('button', { name: 'Today' }));

    expect(updateGlobalDateRange).toHaveBeenCalledWith({ lower: generateDaysAgoDate(0).toISOString(), upper: null });
  });

  test('ends a preset with an end where the preset does', async () => {
    renderDateRangePopover();

    await userEvent.click(screen.getByRole('button', { name: 'Yesterday' }));

    expect(updateGlobalDateRange).toHaveBeenCalledWith({
      lower: generateDaysAgoDate(1).toISOString(),
      upper: subSeconds(generateDaysAgoDate(0), 1).toISOString(),
    });
  });

  test('tracks the preset the user picks', async () => {
    renderDateRangePopover();

    await userEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));

    expect(track).toHaveBeenCalledWith('Select date range preset', 'Date Range: last week');
  });

  test('groups the presets under a name for assistive technology', () => {
    renderDateRangePopover();

    expect(within(screen.getByRole('group', { name: 'Date range presets' })).getAllByRole('button')).toHaveLength(5);
  });

  test('does not show the date filter modes', () => {
    renderDateRangePopover();

    expect(screen.queryByRole('group', { name: 'Date filter mode' })).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
  });
});
