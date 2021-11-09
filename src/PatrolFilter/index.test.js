import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { endOfToday, startOfToday } from '../utils/datetime';
import { fetchTrackedBySchema } from '../ducks/trackedby';
import PatrolFilter, { PATROL_TEXT_FILTER_DEBOUNCE_TIME } from './';
import { mockStore } from '../__test-helpers/MockStore';
import { resetGlobalDateRange } from '../ducks/global-date-range';
import { updatePatrolFilter } from '../ducks/patrol-filter';

jest.mock('../ducks/trackedby', () => ({
  ...jest.requireActual('../ducks/trackedby'),
  fetchTrackedBySchema: jest.fn(),
}));
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
  let fetchTrackedBySchemaMock, resetGlobalDateRangeMock, store, updatePatrolFilterMock;
  beforeEach(() => {
    fetchTrackedBySchemaMock = jest.fn(() => () => {});
    fetchTrackedBySchema.mockImplementation(fetchTrackedBySchemaMock);
    resetGlobalDateRangeMock = jest.fn(() => () => {});
    resetGlobalDateRange.mockImplementation(resetGlobalDateRangeMock);
    updatePatrolFilterMock = jest.fn(() => () => {});
    updatePatrolFilter.mockImplementation(updatePatrolFilterMock);

    store = {
      data: {
        eventSchemas: {},
        patrolFilter: {
          filter: {
            date_range: {
              lower: startOfToday().toISOString(),
              upper: endOfToday().toISOString(),
            },
            leader: null,
            text: '',
          },
        },
        patrolLeaderSchema: {
          trackedbySchema: {
            properties: {
              leader: {
                enum_ext: [{
                  value: { id: 'Leader' },
                }],
              },
            },
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

  test('sets a light background to the advanced filters button', async () => {
    const advancedFiltersButton = await screen.findByTestId('patrolFilter-filtersButton');

    expect(advancedFiltersButton.className).toEqual(expect.stringContaining('btn-light'));
  });

  test('updates the patrol filter when user changes the tracked by in the advanced filters popover', async () => {
    // Open the popover
    const advancedFiltersButton = await screen.findByTestId('patrolFilter-filtersButton');
    userEvent.click(advancedFiltersButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    // Write a valid leader in the tracked by selector textbox and click enter to select it
    const trackedBySelect = (await screen.findAllByRole('textbox'))[1];
    userEvent.type(trackedBySelect, 'Leader');
    userEvent.keyboard('{Enter}');

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { leader: 'Leader' } });
  });

  test('sets a primary background to the advanced filters button if there is a filter applied', async () => {
    store.data.patrolFilter.filter.leader = 'Leader';
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );

    const advancedFiltersButton = await screen.findByTestId('patrolFilter-filtersButton');

    expect(advancedFiltersButton.className).toEqual(expect.stringContaining('btn-primary'));
  });

  test('resets the advanced filters when user clicks the Reset All button', async () => {
    store.data.patrolFilter.filter.leader = 'Leader';
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );

    // Open the popover
    const advancedFiltersButton = await screen.findByTestId('patrolFilter-filtersButton');
    userEvent.click(advancedFiltersButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    // Click the Reset All button
    const resetAdvancedFiltersButton = await screen.findByText('Reset All');
    userEvent.click(resetAdvancedFiltersButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { leader: null } });
  });

  test('resets the tracked by filter when user clicks the Reset button', async () => {
    store.data.patrolFilter.filter.leader = 'Leader';
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );

    // Open the popover
    const advancedFiltersButton = await screen.findByTestId('patrolFilter-filtersButton');
    userEvent.click(advancedFiltersButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    // Click the Reset button
    const resetTrackedByButton = await screen.findByText('Reset');
    userEvent.click(resetTrackedByButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { leader: null } });
  });

  test('sets a light background to the date range button', async () => {
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

  test('updates the patrol overlap filter', async () => {
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