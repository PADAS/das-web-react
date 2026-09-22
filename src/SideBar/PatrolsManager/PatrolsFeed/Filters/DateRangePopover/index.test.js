import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../../../../ducks/patrol-filter';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { render, screen } from '../../../../../test-utils';
import { resetGlobalDateRange } from '../../../../../ducks/global-date-range';
import { TrackerContext } from '../../../../../utils/analytics';

import DateRangePopover from './';

jest.mock('../../../../../ducks/global-date-range', () => ({
  __esModule: true,
  ...jest.requireActual('../../../../../ducks/global-date-range'),
  resetGlobalDateRange: jest.fn(),
}));
jest.mock('../../../../../ducks/patrol-filter', () => ({
  ...jest.requireActual('../../../../../ducks/patrol-filter'),
  updatePatrolFilter: jest.fn(),
}));

describe('SideBar - PatrolsManager - PatrolsFeed - Filters - DateRangePopover', () => {
  let store;

  beforeEach(() => {
    resetGlobalDateRange.mockImplementation(() => () => {});
    updatePatrolFilter.mockImplementation(() => () => {});

    store = {
      data: {
        patrolFilter: {
          filter: {
            date_range: { ...INITIAL_FILTER_STATE.filter.date_range },
            patrols_overlap_daterange: false,
          },
        },
      },
    };
  });

  const renderDateRangePopover = () => render(
    <Provider store={mockStore(store)}>
      <TrackerContext.Provider value={{ track: jest.fn() }}>
        <DateRangePopover />
      </TrackerContext.Provider>
    </Provider>
  );

  const openSettings = () => userEvent.click(screen.getByTestId('settings-gear-icon'));

  test('disables the reset button while the date range is at its default', () => {
    renderDateRangePopover();

    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
  });

  test('resets the date range when the user clicks the reset button', async () => {
    store.data.patrolFilter.filter.date_range.upper = new Date(Date.now() + 86400000).toISOString();

    renderDateRangePopover();

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(resetGlobalDateRange).toHaveBeenCalledTimes(1);
  });

  test('filters by date range overlap when the user picks that mode', async () => {
    renderDateRangePopover();

    await openSettings();
    await userEvent.click(screen.getByRole('radio', { name: 'Filter by date range overlap' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { patrols_overlap_daterange: true } });
  });

  test('filters by start date when the user picks that mode', async () => {
    store.data.patrolFilter.filter.patrols_overlap_daterange = true;

    renderDateRangePopover();

    await openSettings();
    await userEvent.click(screen.getByRole('radio', { name: 'Filter by start date' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { patrols_overlap_daterange: false } });
  });

  test('names the date filter mode group for assistive technology', async () => {
    renderDateRangePopover();

    await openSettings();

    expect(screen.getByRole('group', { name: 'Date filter mode' })).toBeInTheDocument();
  });
});
