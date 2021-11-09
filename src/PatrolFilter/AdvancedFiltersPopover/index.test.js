import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import AdvancedFiltersPopover from './';
import { mockStore } from '../../__test-helpers/MockStore';

describe('PatrolFilter', () => {
  const onTrackedByChange = jest.fn();
  const resetAdvancedFilters = jest.fn();
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
        <AdvancedFiltersPopover
          onTrackedByChange={onTrackedByChange}
          patrolLeaders={[{ id: 'Leader' }]}
          resetAdvancedFilters={resetAdvancedFilters}
          resetTrackedByFilter={resetTrackedByFilter}
          selectedLeader={{ id: 'Leader' }}
          showResetAdvancedFiltersButton
          showResetTrackedByButton
        />
      </Provider>
    );
  });

  test('shows the Reset All button', async () => {
    expect(screen.findByText('Reset All')).toBeTruthy();
  });

  test('doest not show the Reset All button', async () => {
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <AdvancedFiltersPopover onTrackedByChange={onTrackedByChange} showResetAdvancedFiltersButton ={false} />
      </Provider>
    );

    expect(screen.queryByText('Reset All')).toBeNull();
  });

  test('triggers the resetAdvancedFilters callback when user clicks the Reset All button', async () => {
    expect(resetAdvancedFilters).toHaveBeenCalledTimes(0);

    const resetAllButton = await screen.findByText('Reset All');
    userEvent.click(resetAllButton);

    expect(resetAdvancedFilters).toHaveBeenCalledTimes(1);
  });

  test('triggers the onTrackedByChange callback when user selects a tracked by option', async () => {
    expect(onTrackedByChange).toHaveBeenCalledTimes(0);

    const trackedBySelect = await screen.findByRole('textbox');
    userEvent.type(trackedBySelect, 'Leader');
    userEvent.keyboard('{Enter}');

    expect(onTrackedByChange).toHaveBeenCalledTimes(1);
  });

  test('shows the reset tracked by button', async () => {
    const resetTrackedByButton = await screen.findByText('Reset');

    expect(resetTrackedByButton.className).not.toEqual(expect.stringContaining('hidden'));
  });

  test('hides the reset tracked by button', async () => {
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <AdvancedFiltersPopover onTrackedByChange={onTrackedByChange} showResetTrackedByButton ={false} />
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
