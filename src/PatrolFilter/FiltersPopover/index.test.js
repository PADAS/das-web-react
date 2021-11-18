import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import FiltersPopover from '.';
import { mockStore } from '../../__test-helpers/MockStore';

describe('PatrolFilter', () => {
  const onTrackedByChange = jest.fn();
  const resetFilters = jest.fn();
  const resetTrackedByFilter = jest.fn();
  let store;
  beforeEach(() => {
    store = {
      data: {
        eventSchemas: {},
        subjectStore: {},
      },
    };

    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover
          onTrackedByChange={onTrackedByChange}
          patrolLeaders={[{ id: 'Leader' }, { id: 'Leader2' }]}
          resetFilters={resetFilters}
          resetTrackedByFilter={resetTrackedByFilter}
          selectedLeaders={[{ id: 'Leader' }]}
          showResetFiltersButton
          showResetTrackedByButton
        />
      </Provider>
    );
  });

  test('shows the Reset All button if the showResetFiltersButton prop is true', async () => {
    expect(screen.findByText('Reset All')).toBeTruthy();
  });

  test('doest not show the Reset All button if the showResetFiltersButton prop is false', async () => {
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover onTrackedByChange={onTrackedByChange} selectedLeaders={[]} showResetFiltersButton={false} />
      </Provider>
    );

    expect(screen.queryByText('Reset All')).toBeNull();
  });

  test('triggers the resetFilters callback when user clicks the Reset All button', async () => {
    expect(resetFilters).toHaveBeenCalledTimes(0);

    const resetAllButton = await screen.findByText('Reset All');
    userEvent.click(resetAllButton);

    expect(resetFilters).toHaveBeenCalledTimes(1);
  });

  test('triggers the onTrackedByChange callback when user selects a leader', async () => {
    expect(onTrackedByChange).toHaveBeenCalledTimes(0);

    const trackedBySelect = await screen.findByRole('textbox');
    userEvent.type(trackedBySelect, 'Leader2');
    userEvent.keyboard('{Enter}');

    expect(onTrackedByChange).toHaveBeenCalledTimes(1);
  });

  test('shows the reset tracked by button if the showResetTrackedByButton prop is true', async () => {
    const resetTrackedByButton = await screen.findByText('Reset');

    expect(resetTrackedByButton.className).not.toEqual(expect.stringContaining('hidden'));
  });

  test('hides the reset tracked by button if the showResetTrackedByButton prop is false', async () => {
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover onTrackedByChange={onTrackedByChange} selectedLeaders={[]} showResetTrackedByButton ={false} />
      </Provider>
    );

    const resetTrackedByButton = await screen.findByText('Reset');

    expect(resetTrackedByButton.className).toEqual(expect.stringContaining('hidden'));
  });

  test('triggers the resetTrackedByFilter callback when user clicks the Reset button', async () => {
    expect(resetTrackedByFilter).toHaveBeenCalledTimes(0);

    const resetTrackedByButton = await screen.findByText('Reset');
    userEvent.click(resetTrackedByButton);

    expect(resetTrackedByFilter).toHaveBeenCalledTimes(1);
  });
});
