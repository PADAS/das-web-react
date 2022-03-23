import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { endOfToday, startOfToday } from '../utils/datetime';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../ducks/patrol-filter';
import PatrolFilter, { PATROL_TEXT_FILTER_DEBOUNCE_TIME } from './';
import { mockStore } from '../__test-helpers/MockStore';

jest.mock('../ducks/patrol-filter', () => ({
  ...jest.requireActual('../ducks/patrol-filter'),
  updatePatrolFilter: jest.fn(),
}));

describe('PatrolFilter', () => {
  let store, updatePatrolFilterMock;
  beforeEach(() => {
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
            tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
            patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
            text: '',
          },
          status: INITIAL_FILTER_STATE.status,
        },
        patrols: {
          results: [],
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

  test('sets a primary variant to the filters button if there is a filter applied', async () => {
    store.data.patrolFilter.filter.tracked_by = ['Leader 1'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );

    const filtersButton = await screen.findByTestId('patrolFilter-filtersButton');

    expect(filtersButton.className).toEqual(expect.stringContaining('btn-primary'));
  });

  test('sets a light variant to the date range button if there are no filters applied', async () => {
    const dateRangeButton = await screen.findByTestId('patrolFilter-dateRangeButton');

    expect(dateRangeButton.className).toEqual(expect.stringContaining('btn-light'));
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
});