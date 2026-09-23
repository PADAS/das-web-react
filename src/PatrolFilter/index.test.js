import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { endOfToday, generateDaysAgoDate } from '../utils/datetime';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../ducks/patrol-filter';
import PatrolFilter, { PATROL_TEXT_FILTER_DEBOUNCE_TIME } from './';
import { mockStore } from '../__test-helpers/MockStore';
import { cleanup, render, screen, waitFor } from '../test-utils';

jest.mock('../ducks/patrol-filter', () => ({
  ...jest.requireActual('../ducks/patrol-filter'),
  updatePatrolFilter: jest.fn(),
}));

jest.mock('redux-persist', () => {
  return {
    ...jest.requireActual('redux-persist'),
    persistReducer: jest
      .fn((_config, reducers) => reducers)
  };
});

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
              lower: generateDaysAgoDate(1).toISOString(),
              upper: endOfToday().toISOString(),
            },
            tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
            patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
            patrols_overlap_daterange: INITIAL_FILTER_STATE.filter.patrols_overlap_daterange,
            text: '',
          },
          status: INITIAL_FILTER_STATE.status,
        },
        patrolsFeed: [],
        subjectStore: {},
        patrolStore: {},
      },
    };

    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );
  });

  test('updates the search bar text when the user types in it', async () => {
    const searchBar = await screen.findByRole('searchbox');

    expect(searchBar.value).toBe('');
    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    await userEvent.type(searchBar, 'Search');

    await waitFor(() => {
      expect(searchBar.value).toBe('Search');
      expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
      expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { text: 'Search' } });
    });
  });

  test('clears the search bar text when the user clicks the clear button', async () => {
    const searchBar = await screen.findByRole('searchbox');
    await userEvent.type(searchBar, 'Search');

    await waitFor(() => {
      expect(searchBar.value).toBe('Search');
      expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
      expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { text: 'Search' } });
    }, { timeout: PATROL_TEXT_FILTER_DEBOUNCE_TIME + 50 });

    await userEvent.click(screen.getByTestId('reset-search-button'));

    await waitFor(() => {
      expect(searchBar.value).toBe('');
    }, { timeout: PATROL_TEXT_FILTER_DEBOUNCE_TIME });
  });

  test('sets an inactive state to the filters button if there are no filters applied', async () => {
    expect(screen.getByTestId('patrolFilter-filtersButton')).not.toHaveClass('active');
  });

  test('sets an active state to the filters button if there is a filter applied', async () => {
    store.data.patrolFilter.filter.tracked_by = ['Leader 1'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );

    expect(screen.getByTestId('patrolFilter-filtersButton')).toHaveClass('active');
  });

  test('sets an inactive state to the date range button if there are no filters applied', async () => {
    expect(screen.getByTestId('patrolFilter-dateRangeButton')).not.toHaveClass('active');
  });

  test('sets an active state to the date range button if there is a filter applied', async () => {
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

    expect(screen.getByTestId('patrolFilter-dateRangeButton')).toHaveClass('active');
  });

  test('sets an active state to the date range button if the date filter mode is changed', async () => {
    store.data.patrolFilter.filter.patrols_overlap_daterange = false;
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );

    expect(screen.getByTestId('patrolFilter-dateRangeButton')).toHaveClass('active');
  });

  test('resets the date filter mode when the user clicks the global reset button', async () => {
    store.data.patrolFilter.filter.patrols_overlap_daterange = false;
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <PatrolFilter />
      </Provider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith(expect.objectContaining({
      filter: expect.objectContaining({
        patrols_overlap_daterange: INITIAL_FILTER_STATE.filter.patrols_overlap_daterange,
      }),
    }));
  });
});
