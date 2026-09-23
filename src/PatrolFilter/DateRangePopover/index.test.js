import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import DateRangePopover from '.';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../ducks/patrol-filter';
import { resetGlobalDateRange } from '../../ducks/global-date-range';
import { mockStore } from '../../__test-helpers/MockStore';
import { render, screen, waitFor } from '../../test-utils';

jest.mock('../../ducks/global-date-range', () => ({
  __esModule: true,
  ...jest.requireActual('../../ducks/global-date-range'),
  resetGlobalDateRange: jest.fn(),
}));
jest.mock('../../ducks/patrol-filter', () => ({
  ...jest.requireActual('../../ducks/patrol-filter'),
  updatePatrolFilter: jest.fn(),
}));

describe('DateRangePopover', () => {
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
              lower: INITIAL_FILTER_STATE.filter.date_range.lower,
              upper: INITIAL_FILTER_STATE.filter.date_range.upper,
            },
            patrols_overlap_daterange: INITIAL_FILTER_STATE.filter.patrols_overlap_daterange,
          },
        },
      },
    };
  });

  test('resets the date range when user clicks the Reset button', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.toISOString();
    store.data.patrolFilter.filter.date_range.upper = tomorrow;
    render(
      <Provider store={mockStore(store)}>
        <DateRangePopover />
      </Provider>
    );

    expect(resetGlobalDateRange).toHaveBeenCalledTimes(0);

    const resetButton = await screen.findByText('Reset');
    await userEvent.click(resetButton);

    await waitFor(() => {
      expect(resetGlobalDateRange).toHaveBeenCalledTimes(1);
    });
  });

  test('disables the Reset button while the date range and the date filter mode are at their defaults', () => {
    render(
      <Provider store={mockStore(store)}>
        <DateRangePopover />
      </Provider>
    );

    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
  });

  test('resets the date filter mode when the user clicks the Reset button', async () => {
    store.data.patrolFilter.filter.patrols_overlap_daterange = false;
    render(
      <Provider store={mockStore(store)}>
        <DateRangePopover />
      </Provider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({
      filter: { patrols_overlap_daterange: INITIAL_FILTER_STATE.filter.patrols_overlap_daterange },
    });
  });

  test('updates the patrol overlap filter when the user clicks the date overlap radio button', async () => {
    store.data.patrolFilter.filter.patrols_overlap_daterange = false;
    render(
      <Provider store={mockStore(store)}>
        <DateRangePopover />
      </Provider>
    );

    expect(resetGlobalDateRange).toHaveBeenCalledTimes(0);

    // Click the patrol filter settings button
    const patrolFilterSettings = await screen.getByTestId('settings-gear-icon');
    await userEvent.click(patrolFilterSettings);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    // Click date overlap radio button
    const dateRangeOverlapRadioButton = (await screen.findAllByRole('radio'))[1];
    await userEvent.click(dateRangeOverlapRadioButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { patrols_overlap_daterange: true } });
  });
});
