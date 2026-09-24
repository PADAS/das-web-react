import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { DEFAULT_EVENT_SORT, EVENT_SORT_OPTIONS, SORT_DIRECTION } from '../../../../constants';
import eventCategories from '../../../../__test-helpers/fixtures/event-categories';
import { eventTypes } from '../../../../__test-helpers/fixtures/event-types';
import { INITIAL_FILTER_STATE, updateEventFilter } from '../../../../ducks/event-filter';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { render, screen, waitFor } from '../../../../test-utils';
import { resetGlobalDateRange } from '../../../../ducks/global-date-range';
import { TrackerContext } from '../../../../utils/analytics';

import Filters, { TEXT_FILTER_DEBOUNCE_DELAY } from './';

jest.mock('../../../../ducks/event-filter', () => ({
  ...jest.requireActual('../../../../ducks/event-filter'),
  updateEventFilter: jest.fn(),
}));
jest.mock('../../../../ducks/global-date-range', () => ({
  __esModule: true,
  ...jest.requireActual('../../../../ducks/global-date-range'),
  resetGlobalDateRange: jest.fn(),
}));

describe('SideBar - EventsManager - EventsFeed - Filters', () => {
  let store;

  beforeEach(() => {
    resetGlobalDateRange.mockImplementation(() => () => {});
    updateEventFilter.mockImplementation(() => () => {});

    store = {
      data: {
        eventCategories,
        eventFilter: cloneDeep(INITIAL_FILTER_STATE),
        eventSchemas: {},
        eventTypes,
        subjectStore: {},
      },
      view: { systemConfig: { previewFeatures: {} } },
    };
  });

  const renderFilters = (props) => render(
    <Provider store={mockStore(store)}>
      <TrackerContext.Provider value={{ track: jest.fn() }}>
        <Filters resultCount={3} {...props} />
      </TrackerContext.Provider>
    </Provider>
  );

  test('summarizes how many events the feed is listing and over what range', () => {
    renderFilters();

    expect(screen.getByText(/3 results from/)).toBeVisible();
  });

  test('summarizes a single result in the singular', () => {
    renderFilters({ resultCount: 1 });

    expect(screen.getByText(/1 result from/)).toBeVisible();
  });

  test('says the results are filtered once a filter has been modified', () => {
    store.data.eventFilter.state = ['resolved'];

    renderFilters();

    expect(screen.getByText(/3 results filtered from/)).toBeVisible();
  });

  test('says the results are filtered while there is search text', () => {
    store.data.eventFilter.filter.text = 'snare';

    renderFilters();

    expect(screen.getByText(/3 results filtered from/)).toBeVisible();
  });

  test('does not say the results are filtered when only the sort is modified', () => {
    store.data.eventFilter.filter.sort = [SORT_DIRECTION.up, EVENT_SORT_OPTIONS[0]];

    renderFilters();

    expect(screen.getByText(/3 results from/)).toBeVisible();
  });

  test('searches events after the user stops typing', async () => {
    renderFilters();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search Events...' }), 'snare');

    expect(updateEventFilter).toHaveBeenCalledTimes(0);

    await waitFor(
      () => expect(updateEventFilter).toHaveBeenCalledWith({ filter: { text: 'snare' } }),
      { timeout: TEXT_FILTER_DEBOUNCE_DELAY * 5 }
    );
    expect(updateEventFilter).toHaveBeenCalledTimes(1);
  });

  test('clears the search text right away when the user clears the search box', async () => {
    store.data.eventFilter.filter.text = 'snare';

    renderFilters();

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(updateEventFilter).toHaveBeenCalledWith({ filter: { text: '' } });
    expect(screen.getByRole('searchbox', { name: 'Search Events...' })).toHaveValue('');
  });

  test('announces that both triggers open a dialog', () => {
    renderFilters();

    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.getByRole('button', { name: 'Dates' })).toHaveAttribute('aria-haspopup', 'dialog');
  });

  test('opens and closes the filters popover from its trigger', async () => {
    renderFilters();

    const filtersButton = screen.getByRole('button', { name: 'Filters' });

    expect(filtersButton).toHaveAttribute('aria-expanded', 'false');
    expect(filtersButton).not.toHaveAttribute('aria-controls');

    await userEvent.click(filtersButton);

    const filtersPopover = await screen.findByRole('dialog', { name: 'Event Filters' });

    expect(filtersButton).toHaveAttribute('aria-expanded', 'true');
    expect(filtersButton).toHaveAttribute('aria-controls', filtersPopover.id);
    expect(filtersPopover).toBeVisible();

    await userEvent.click(filtersButton);

    expect(filtersButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('opens and closes the dates popover from its trigger', async () => {
    renderFilters();

    const datesButton = screen.getByRole('button', { name: 'Dates' });

    expect(datesButton).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(datesButton);

    const datesPopover = await screen.findByRole('dialog', { name: 'Date Range' });

    expect(datesButton).toHaveAttribute('aria-expanded', 'true');
    expect(datesButton).toHaveAttribute('aria-controls', datesPopover.id);
    expect(datesPopover).toBeVisible();

    await userEvent.click(datesButton);

    expect(datesButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('swaps straight from the filters popover to the dates popover', async () => {
    renderFilters();

    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(await screen.findByRole('dialog', { name: 'Event Filters' })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Dates' }));

    expect(await screen.findByRole('dialog', { name: 'Date Range' })).toBeVisible();
    expect(screen.queryByRole('dialog', { name: 'Event Filters' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes the filters popover and restores focus when the user presses escape', async () => {
    renderFilters();

    const filtersButton = screen.getByRole('button', { name: 'Filters' });

    await userEvent.click(filtersButton);

    expect(await screen.findByRole('dialog', { name: 'Event Filters' })).toHaveFocus();

    await userEvent.keyboard('{Escape}');

    expect(filtersButton).toHaveAttribute('aria-expanded', 'false');
    expect(filtersButton).toHaveFocus();
  });

  test('closes the filters popover when the user clicks outside it', async () => {
    renderFilters();

    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(await screen.findByRole('dialog', { name: 'Event Filters' })).toBeVisible();

    await userEvent.click(screen.getByRole('searchbox', { name: 'Search Events...' }));

    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes the dates popover and restores focus when the user presses escape', async () => {
    renderFilters();

    const datesButton = screen.getByRole('button', { name: 'Dates' });

    await userEvent.click(datesButton);

    expect(await screen.findByRole('dialog', { name: 'Date Range' })).toBeVisible();

    await userEvent.keyboard('{Escape}');

    expect(datesButton).toHaveAttribute('aria-expanded', 'false');
    expect(datesButton).toHaveFocus();
  });

  test('closes the dates popover when the user clicks outside it', async () => {
    renderFilters();

    await userEvent.click(screen.getByRole('button', { name: 'Dates' }));

    expect(await screen.findByRole('dialog', { name: 'Date Range' })).toBeVisible();

    await userEvent.click(screen.getByRole('searchbox', { name: 'Search Events...' }));

    expect(screen.getByRole('button', { name: 'Dates' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('leaves both triggers inactive while every filter is at its default', () => {
    renderFilters();

    expect(screen.getByRole('button', { name: 'Filters' })).not.toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Dates' })).not.toHaveClass('active');
  });

  test('marks the filters trigger as active and names its state while the state filter is modified', () => {
    store.data.eventFilter.state = ['resolved'];

    renderFilters();

    expect(screen.getByRole('button', { name: 'Filters, filters applied' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Dates' })).not.toHaveClass('active');
  });

  test('names the filters trigger state while the priority filter is modified', () => {
    store.data.eventFilter.filter.priority = [300];

    renderFilters();

    expect(screen.getByRole('button', { name: 'Filters, filters applied' })).toHaveClass('active');
  });

  test('names the filters trigger state while the reported by filter is modified', () => {
    store.data.eventFilter.filter.reported_by = ['reporter-id'];

    renderFilters();

    expect(screen.getByRole('button', { name: 'Filters, filters applied' })).toHaveClass('active');
  });

  test('names the filters trigger state while the event type filter is modified', () => {
    store.data.eventFilter.filter.event_type = [eventTypes[0].id];

    renderFilters();

    expect(screen.getByRole('button', { name: 'Filters, filters applied' })).toHaveClass('active');
  });

  test('names the dates trigger state while the date range is modified', () => {
    store.data.eventFilter.filter.date_range = { lower: '2026-09-01T00:00:00.000Z', upper: null };

    renderFilters();

    expect(screen.getByRole('button', { name: 'Dates, date filters applied' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Filters' })).not.toHaveClass('active');
  });

  test('does not offer to reset while every filter is at its default', () => {
    renderFilters();

    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();
  });

  test('offers to reset while there is search text', () => {
    store.data.eventFilter.filter.text = 'snare';

    renderFilters();

    expect(screen.getByRole('button', { name: 'Reset' })).toBeVisible();
  });

  test('offers to reset once the user types in the search box', async () => {
    renderFilters();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search Events...' }), 's');

    expect(screen.getByRole('button', { name: 'Reset' })).toBeVisible();
  });

  test('offers to reset while a filter is modified', () => {
    store.data.eventFilter.filter.priority = [300];

    renderFilters();

    expect(screen.getByRole('button', { name: 'Reset' })).toBeVisible();
  });

  test('offers to reset while the date range is modified', () => {
    store.data.eventFilter.filter.date_range = { lower: '2026-09-01T00:00:00.000Z', upper: null };

    renderFilters();

    expect(screen.getByRole('button', { name: 'Reset' })).toBeVisible();
  });

  test('offers to reset while the sort direction is modified', () => {
    store.data.eventFilter.filter.sort = [SORT_DIRECTION.up, EVENT_SORT_OPTIONS[0]];

    renderFilters();

    expect(screen.getByRole('button', { name: 'Reset' })).toBeVisible();
  });

  test('offers to reset while the sort option is modified', () => {
    store.data.eventFilter.filter.sort = [SORT_DIRECTION.down, EVENT_SORT_OPTIONS[2]];

    renderFilters();

    expect(screen.getByRole('button', { name: 'Reset' })).toBeVisible();
  });

  test('resets the filters, the search text, the sort and the date range at once', async () => {
    store.data.eventFilter.filter.text = 'snare';
    store.data.eventFilter.state = ['resolved'];

    renderFilters();

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(updateEventFilter).toHaveBeenCalledWith({
      filter: {
        event_type: INITIAL_FILTER_STATE.filter.event_type,
        priority: INITIAL_FILTER_STATE.filter.priority,
        reported_by: INITIAL_FILTER_STATE.filter.reported_by,
        sort: DEFAULT_EVENT_SORT,
        text: INITIAL_FILTER_STATE.filter.text,
      },
      state: INITIAL_FILTER_STATE.state,
    });
    expect(resetGlobalDateRange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('searchbox', { name: 'Search Events...' })).toHaveValue('');
  });

  test('does not apply a pending search once the user resets', async () => {
    store.data.eventFilter.state = ['resolved'];

    renderFilters();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search Events...' }), 'snare');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    await new Promise((resolve) => setTimeout(resolve, TEXT_FILTER_DEBOUNCE_DELAY * 2));

    expect(updateEventFilter).toHaveBeenCalledTimes(1);
    expect(updateEventFilter).not.toHaveBeenCalledWith({ filter: { text: 'snare' } });
  });
});
