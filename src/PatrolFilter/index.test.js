import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { endOfToday, startOfToday } from '../utils/datetime';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../ducks/patrol-filter';
import PatrolFilter, { PATROL_TEXT_FILTER_DEBOUNCE_TIME } from './';
import { mockStore } from '../__test-helpers/MockStore';
import { resetGlobalDateRange } from '../ducks/global-date-range';

jest.mock('../ducks/global-date-range', () => ({
  __esModule: true,
  ...jest.requireActual('../ducks/global-date-range'),
  resetGlobalDateRange: jest.fn(),
}));
jest.mock('../ducks/patrol-filter', () => ({
  ...jest.requireActual('../ducks/patrol-filter'),
  updatePatrolFilter: jest.fn(),
}));

describe('PatrolFilter', () => {
  let resetGlobalDateRangeMock, store, updatePatrolFilterMock;
  beforeEach(() => {
    resetGlobalDateRangeMock = jest.fn(() => () => {});
    resetGlobalDateRange.mockImplementation(resetGlobalDateRangeMock);
    updatePatrolFilterMock = jest.fn(() => () => {});
    updatePatrolFilter.mockImplementation(updatePatrolFilterMock);

    store = {
      data: {
        patrolFilter: {
          filter: {
            date_range: {
              lower: startOfToday().toISOString(),
              upper: endOfToday().toISOString(),
            },
            leaders: INITIAL_FILTER_STATE.filter.leaders,
            patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
            status: INITIAL_FILTER_STATE.filter.status,
            text: '',
          },
        },
        subjectStore: {},
      },
    };

    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );
  });

  test('updates the search bar text when the user types in it', async () => {
    const searchBar = await screen.findByTestId('search-input');

    expect(searchBar.value).toBe('');
    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    userEvent.type(searchBar, 'Search');

    await waitFor(() => {
      expect(searchBar.value).toBe('Search');
      expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
      expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { text: 'Search' } });
    }, { timeout: PATROL_TEXT_FILTER_DEBOUNCE_TIME + 50 });
  });

  test('clears the search bar text when the user clicks the clear button', async () => {
    const searchBar = await screen.findByTestId('search-input');
    const clearSearchBarButton = await screen.findByTestId('reset-search-button');
    userEvent.type(searchBar, 'Search');

    await waitFor(() => {
      expect(searchBar.value).toBe('Search');
      expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
      expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { text: 'Search' } });
    }, { timeout: PATROL_TEXT_FILTER_DEBOUNCE_TIME + 50 });

    userEvent.click(clearSearchBarButton);

    await waitFor(() => {
      expect(searchBar.value).toBe('');
    }, { timeout: PATROL_TEXT_FILTER_DEBOUNCE_TIME });
  });

  test('sets a light variant to the filters button if there are no filters applied', async () => {
    const filtersButton = await screen.findByTestId('patrolFilter-filtersButton');

    expect(filtersButton.className).toEqual(expect.stringContaining('btn-light'));
  });

  test('updates the patrol filter when user checks a status', async () => {
    // Open the popover
    const filtersButton = await screen.findByTestId('patrolFilter-filtersButton');
    userEvent.click(filtersButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    // Selects the active status checkbos
    const activeStatusCheckbox = (await screen.findAllByRole('checkbox'))[1];
    userEvent.click(activeStatusCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { status: ['active'] } });
  });

  test('updates the patrol filter when user checks a second status', async () => {
    store.data.patrolFilter.filter.status = ['active'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );

    // Open the popover
    const filtersButton = await screen.findByTestId('patrolFilter-filtersButton');
    userEvent.click(filtersButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    // Selects the overdue status checkbox
    const overdueStatusCheckbox = (await screen.findAllByRole('checkbox'))[3];
    userEvent.click(overdueStatusCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { status: ['active', 'overdue'] } });
  });

  test('updates the patrol filter when user clicks the All status option', async () => {
    store.data.patrolFilter.filter.status = ['active'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );

    // Open the popover
    const filtersButton = await screen.findByTestId('patrolFilter-filtersButton');
    userEvent.click(filtersButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    // Selects the all status checkbox
    const allStatusCheckbox = (await screen.findAllByRole('checkbox'))[0];
    userEvent.click(allStatusCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { status: ['all'] } });
  });

  test('sets a primary variant to the filters button if there is a filter applied', async () => {
    store.data.patrolFilter.filter.leaders = ['Leader 1'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );

    const filtersButton = await screen.findByTestId('patrolFilter-filtersButton');

    expect(filtersButton.className).toEqual(expect.stringContaining('btn-primary'));
  });

  test('resets the status filter when user clicks the Reset button', async () => {
    store.data.patrolFilter.filter.status = ['active'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );

    // Open the popover
    const filtersButton = await screen.findByTestId('patrolFilter-filtersButton');
    userEvent.click(filtersButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    // Click the Reset button
    const resetStatusButton = (await screen.findAllByText('Reset'))[1];
    userEvent.click(resetStatusButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { status: INITIAL_FILTER_STATE.filter.status } });
  });

  test('sets a light variant to the date range button if there are no filters applied', async () => {
    const dateRangeButton = await screen.findByTestId('patrolFilter-dateRangeButton');

    expect(dateRangeButton.className).toEqual(expect.stringContaining('btn-light'));
  });

  test('resets the date range when user clicks the Reset button', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.toISOString();
    store.data.patrolFilter.filter.date_range.upper = tomorrow;
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );

    // Open the popover
    const dateRangeButton = await screen.findByTestId('patrolFilter-dateRangeButton');
    userEvent.click(dateRangeButton);

    expect(resetGlobalDateRange).toHaveBeenCalledTimes(0);

    // Click the Reset button
    const resetDateRangeButton = await screen.findByText('Reset');
    userEvent.click(resetDateRangeButton);

    expect(resetGlobalDateRange).toHaveBeenCalledTimes(1);
  });

  test('sets a primary variant to the date range button if there is a filter applied', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.toISOString();
    store.data.patrolFilter.filter.date_range.upper = tomorrow;
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );

    const dateRangeButton = await screen.findByTestId('patrolFilter-dateRangeButton');

    expect(dateRangeButton.className).toEqual(expect.stringContaining('btn-primary'));
  });

  test('updates the patrol overlap filter when the user clicks the date overlap radio button', async () => {
    // Open the popover
    const dateRangeButton = await screen.findByTestId('patrolFilter-dateRangeButton');
    userEvent.click(dateRangeButton);

    expect(resetGlobalDateRange).toHaveBeenCalledTimes(0);

    // Click the patrol filter settings button
    const patrolFilterSettings = (await screen.findAllByRole('button'))[9];
    userEvent.click(patrolFilterSettings);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    // Click date overlap radio button
    const dateRangeOverlapRadioButton = (await screen.findAllByRole('radio'))[1];
    userEvent.click(dateRangeOverlapRadioButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { patrols_overlap_daterange: true } });
  });
});