import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../../../ducks/patrol-filter';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { render, screen, waitFor } from '../../../../test-utils';
import { resetGlobalDateRange } from '../../../../ducks/global-date-range';
import { TrackerContext } from '../../../../utils/analytics';

import Filters, { TEXT_FILTER_DEBOUNCE_DELAY } from './';

jest.mock('../../../../ducks/global-date-range', () => ({
  __esModule: true,
  ...jest.requireActual('../../../../ducks/global-date-range'),
  resetGlobalDateRange: jest.fn(),
}));
jest.mock('../../../../ducks/patrol-filter', () => ({
  ...jest.requireActual('../../../../ducks/patrol-filter'),
  updatePatrolFilter: jest.fn(),
}));

describe('SideBar - PatrolsManager - PatrolsFeed - Filters', () => {
  let store;

  beforeEach(() => {
    resetGlobalDateRange.mockImplementation(() => () => {});
    updatePatrolFilter.mockImplementation(() => () => {});

    store = {
      data: {
        patrolFilter: {
          filter: {
            date_range: { ...INITIAL_FILTER_STATE.filter.date_range },
            patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
            patrols_overlap_daterange: INITIAL_FILTER_STATE.filter.patrols_overlap_daterange,
            text: INITIAL_FILTER_STATE.filter.text,
            tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
          },
          status: INITIAL_FILTER_STATE.status,
        },
        patrolTeamAndTrackingOptions: { leaders: [] },
        patrolTypes: [],
      },
    };
  });

  const renderFilters = (props) => render(
    <Provider store={mockStore(store)}>
      <TrackerContext.Provider value={{ track: jest.fn() }}>
        <Filters resultCount={3} {...props} />
      </TrackerContext.Provider>
    </Provider>
  );

  test('summarizes how many patrols the feed is listing and over what range', () => {
    renderFilters();

    expect(screen.getByText(/3 results from/)).toBeVisible();
  });

  test('summarizes a single result in the singular', () => {
    renderFilters({ resultCount: 1 });

    expect(screen.getByText(/1 result from/)).toBeVisible();
  });

  test('says the results are filtered once a filter has been modified', () => {
    store.data.patrolFilter.status = ['active'];

    renderFilters();

    expect(screen.getByText(/3 results filtered from/)).toBeVisible();
  });

  test('searches patrols after the user stops typing', async () => {
    renderFilters();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search Patrols...' }), 'snare');

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    await waitFor(
      () => expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { text: 'snare' } }),
      { timeout: TEXT_FILTER_DEBOUNCE_DELAY * 5 }
    );
  });

  test('clears the search text right away when the user clears the search box', async () => {
    store.data.patrolFilter.filter.text = 'snare';

    renderFilters();

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { text: '' } });
  });

  test('opens and closes the filters popover from its trigger', async () => {
    renderFilters();

    const filtersButton = screen.getByRole('button', { name: 'Filters' });

    expect(filtersButton).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(filtersButton);

    expect(filtersButton).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByRole('dialog', { name: 'Patrol Filters' })).toBeVisible();

    await userEvent.click(filtersButton);

    expect(filtersButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('keeps the filters popover styles alongside the classes its overlay adds', async () => {
    renderFilters();

    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(await screen.findByRole('dialog', { name: 'Patrol Filters' })).toHaveClass('filtersPopover', 'fade', 'show');
  });

  test('swaps straight from the filters popover to the dates popover', async () => {
    renderFilters();

    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(await screen.findByRole('dialog', { name: 'Patrol Filters' })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Dates' }));

    expect(await screen.findByRole('dialog', { name: 'Date Range' })).toBeVisible();
    expect(screen.queryByRole('dialog', { name: 'Patrol Filters' })).toBeNull();
  });

  test('closes the filters popover and restores focus when the user presses escape', async () => {
    renderFilters();

    const filtersButton = screen.getByRole('button', { name: 'Filters' });

    await userEvent.click(filtersButton);

    expect(await screen.findByRole('dialog', { name: 'Patrol Filters' })).toHaveFocus();

    await userEvent.keyboard('{Escape}');

    expect(filtersButton).toHaveAttribute('aria-expanded', 'false');
    expect(filtersButton).toHaveFocus();
  });

  test('closes the filters popover when the user clicks outside it', async () => {
    renderFilters();

    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(await screen.findByRole('dialog', { name: 'Patrol Filters' })).toBeVisible();

    await userEvent.click(screen.getByRole('searchbox', { name: 'Search Patrols...' }));

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

    await userEvent.click(screen.getByRole('searchbox', { name: 'Search Patrols...' }));

    expect(screen.getByRole('button', { name: 'Dates' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('does not offer to reset while every filter is at its default', () => {
    renderFilters();

    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();
  });

  test('resets the filters, the search text, the date filter mode and the date range at once', async () => {
    store.data.patrolFilter.status = ['active'];

    renderFilters();

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({
      filter: {
        patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
        patrols_overlap_daterange: INITIAL_FILTER_STATE.filter.patrols_overlap_daterange,
        text: INITIAL_FILTER_STATE.filter.text,
        tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
      },
      status: INITIAL_FILTER_STATE.status,
    });
    expect(resetGlobalDateRange).toHaveBeenCalledTimes(1);
  });

  test('marks a trigger as active and names its state while its own filter is modified', () => {
    store.data.patrolFilter.status = ['active'];

    renderFilters();

    expect(screen.getByRole('button', { name: 'Filters, filters applied' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Dates' })).not.toHaveClass('active');
  });

  test('names the dates trigger state while the date range is modified', () => {
    store.data.patrolFilter.filter.date_range = { lower: '2026-09-01T00:00:00.000Z', upper: null };

    renderFilters();

    expect(screen.getByRole('button', { name: 'Dates, date filters applied' })).toHaveClass('active');
  });

  test('names the dates trigger state while the date filter mode is modified', () => {
    store.data.patrolFilter.filter.patrols_overlap_daterange = !INITIAL_FILTER_STATE.filter.patrols_overlap_daterange;

    renderFilters();

    expect(screen.getByRole('button', { name: 'Dates, date filters applied' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });
});
