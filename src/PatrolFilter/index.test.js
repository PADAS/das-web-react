import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { endOfToday, startOfToday } from '../utils/datetime';
import { fetchTrackedBySchema } from '../ducks/trackedby';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../ducks/patrol-filter';
import PatrolFilter, { PATROL_TEXT_FILTER_DEBOUNCE_TIME } from './';
import { mockStore } from '../__test-helpers/MockStore';
import { resetGlobalDateRange } from '../ducks/global-date-range';

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
        eventSchemas: {
          globalSchema: {
            properties: {
              reported_by: {
                enum_ext: [{
                  value: { id: 'Leader' },
                }],
              },
            },
          },
        },
        patrolFilter: {
          filter: {
            date_range: {
              lower: startOfToday().toISOString(),
              upper: endOfToday().toISOString(),
            },
            leaders: INITIAL_FILTER_STATE.filter.leaders,
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

  test('sets a light variant to the filters button', async () => {
    const filtersButton = await screen.findByTestId('patrolFilter-filtersButton');

    expect(filtersButton.className).toEqual(expect.stringContaining('btn-light'));
  });

  test('updates the patrol filter when user changes the tracked by in the filters popover', async () => {
    // Open the popover
    const filtersButton = await screen.findByTestId('patrolFilter-filtersButton');
    userEvent.click(filtersButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    // Write a valid leader in the tracked by selector textbox and click enter to select it
    const trackedBySelect = (await screen.findAllByRole('textbox'))[1];
    userEvent.type(trackedBySelect, 'Leader');
    userEvent.keyboard('{Enter}');

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { leaders: ['Leader'] } });
  });

  test('sets a primary variant to the filters button if there is a filter applied', async () => {
    store.data.patrolFilter.filter.leaders = ['Leader'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );

    const filtersButton = await screen.findByTestId('patrolFilter-filtersButton');

    expect(filtersButton.className).toEqual(expect.stringContaining('btn-primary'));
  });

  test('resets the filters when user clicks the Reset All button', async () => {
    store.data.patrolFilter.filter.leaders = ['Leader'];
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

    // Click the Reset All button
    const resetFiltersButton = await screen.findByText('Reset All');
    userEvent.click(resetFiltersButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { leaders: INITIAL_FILTER_STATE.filter.leaders } });
  });

  test('resets the tracked by filter when user clicks the Reset button', async () => {
    store.data.patrolFilter.filter.leaders = ['Leader'];
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
    const resetTrackedByButton = await screen.findByText('Reset');
    userEvent.click(resetTrackedByButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { leaders: INITIAL_FILTER_STATE.filter.leaders } });
  });

  test('sets a light variant to the date range button', async () => {
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