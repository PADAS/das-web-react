import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import FiltersPopover from '.';
import { mockStore } from '../../__test-helpers/MockStore';

describe('PatrolFilter', () => {
  const onLeadersFilterChange = jest.fn();
  const onPatrolTypesFilterChange = jest.fn();
  const onStatusFilterChange = jest.fn();
  const resetFilters = jest.fn();
  const resetLeadersFilter = jest.fn();
  const resetPatrolTypesFilter = jest.fn();
  const resetStatusFilter = jest.fn();
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
          onLeadersFilterChange={onLeadersFilterChange}
          onPatrolTypesFilterChange={onPatrolTypesFilterChange}
          onStatusFilterChange={onStatusFilterChange}
          leaderFilterOptions={[{ id: 'Leader 1' }, { id: 'Leader 2' }]}
          patrolTypeFilterOptions={[{
            checked: true,
            id: 'all',
            value: 'All',
          }, {
            checked: false,
            id: 'dog_patrol',
            value: <div>Dog Patrol</div>,
          }, {
            checked: false,
            id: 'fence_patrol',
            value: <div>Fence Patrol</div>,
          }]}
          statusFilterOptions={[{
            checked: true,
            id: 'all',
            value: 'All',
          }, {
            checked: false,
            id: 'active',
            value: <div>Active</div>,
          }, {
            checked: false,
            id: 'overdue',
            value: <div>Overdue</div>,
          }]}
          resetFilters={resetFilters}
          resetLeadersFilter={resetLeadersFilter}
          resetPatrolTypesFilter={resetPatrolTypesFilter}
          resetStatusFilter={resetStatusFilter}
          selectedLeaders={[{ id: 'Leader 1' }]}
          showResetFiltersButton
          showResetLeadersFilterButton
          showResetPatrolTypesFilterButton
          showResetStatusFilterButton
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
        <FiltersPopover
          onPatrolTypesFilterChange={onPatrolTypesFilterChange}
          onStatusFilterChange={onStatusFilterChange}
          onLeadersFilterChange={onLeadersFilterChange}
          showResetFiltersButton={false}
        />
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

  test('triggers the onLeadersFilterChange callback when user selects a leaders option', async () => {
    expect(onLeadersFilterChange).toHaveBeenCalledTimes(0);

    const leadersSelect = await screen.findByRole('textbox');
    userEvent.type(leadersSelect, 'Leader 2');
    userEvent.keyboard('{Enter}');

    expect(onLeadersFilterChange).toHaveBeenCalledTimes(1);
  });

  test('shows the reset leaders button if the showResetLeadersFilterButton prop is true', async () => {
    const resetLeadersButton = (await screen.findAllByText('Reset'))[0];

    expect(resetLeadersButton.className).not.toEqual(expect.stringContaining('hidden'));
  });

  test('hides the reset leaders button if the showResetLeadersFilterButton prop is false', async () => {
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover
          onPatrolTypesFilterChange={onPatrolTypesFilterChange}
          onStatusFilterChange={onStatusFilterChange}
          onLeadersFilterChange={onLeadersFilterChange}
          showResetLeadersFilterButton={false}
        />
      </Provider>
    );

    const resetLeadersButton = (await screen.findAllByText('Reset'))[0];

    expect(resetLeadersButton.className).toEqual(expect.stringContaining('hidden'));
  });

  test('triggers the resetLeadersFilter callback when user clicks the Reset button', async () => {
    expect(resetLeadersFilter).toHaveBeenCalledTimes(0);

    const resetLeadersButton = (await screen.findAllByText('Reset'))[0];
    userEvent.click(resetLeadersButton);

    expect(resetLeadersFilter).toHaveBeenCalledTimes(1);
  });

  test('triggers the onStatusFilterChange callback when user checks a status', async () => {
    expect(onStatusFilterChange).toHaveBeenCalledTimes(0);

    const activeStatusCheckbox = (await screen.findAllByRole('checkbox'))[1];
    userEvent.click(activeStatusCheckbox);

    expect(onStatusFilterChange).toHaveBeenCalledTimes(1);
  });

  test('shows the reset status button if the showResetStatusFilterButton prop is true', async () => {
    const reseStatusButton = (await screen.findAllByText('Reset'))[1];

    expect(reseStatusButton.className).not.toEqual(expect.stringContaining('hidden'));
  });

  test('hides the reset patrol types button if the showResetPatrolTypesFilterButton prop is false', async () => {
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover
          onPatrolTypesFilterChange={onPatrolTypesFilterChange}
          onStatusFilterChange={onStatusFilterChange}
          onLeadersFilterChange={onLeadersFilterChange}
          showResetStatusFilterButton={false}
        />
      </Provider>
    );

    const resetStatusButton = (await screen.findAllByText('Reset'))[1];

    expect(resetStatusButton.className).toEqual(expect.stringContaining('hidden'));
  });

  test('triggers the resetStatusFilter callback when user clicks the Reset button', async () => {
    expect(resetStatusFilter).toHaveBeenCalledTimes(0);

    const resetStatusButton = (await screen.findAllByText('Reset'))[1];
    userEvent.click(resetStatusButton);

    expect(resetStatusFilter).toHaveBeenCalledTimes(1);
  });

  test('triggers the onPatrolTypesFilterChange callback when user checks a patrol type', async () => {
    expect(onPatrolTypesFilterChange).toHaveBeenCalledTimes(0);

    const dogPatrolCheckbox = (await screen.findAllByRole('checkbox'))[4];
    userEvent.click(dogPatrolCheckbox);

    expect(onPatrolTypesFilterChange).toHaveBeenCalledTimes(1);
  });

  test('shows the reset patrol types button if the showResetPatrolTypesFilterButton prop is true', async () => {
    const resetPatrolTypesButton = (await screen.findAllByText('Reset'))[2];

    expect(resetPatrolTypesButton.className).not.toEqual(expect.stringContaining('hidden'));
  });

  test('hides the reset patrol types button if the showResetPatrolTypesFilterButton prop is false', async () => {
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover
          onPatrolTypesFilterChange={onPatrolTypesFilterChange}
          onStatusFilterChange={onStatusFilterChange}
          onLeadersFilterChange={onLeadersFilterChange}
          showResetPatrolTypesFilterButton={false}
        />
      </Provider>
    );

    const resetPatrolTypesButton = (await screen.findAllByText('Reset'))[2];

    expect(resetPatrolTypesButton.className).toEqual(expect.stringContaining('hidden'));
  });

  test('triggers the resetPatrolTypesFilter callback when user clicks the Reset button', async () => {
    expect(resetPatrolTypesFilter).toHaveBeenCalledTimes(0);

    const resetPatrolTypesButton = (await screen.findAllByText('Reset'))[2];
    userEvent.click(resetPatrolTypesButton);

    expect(resetPatrolTypesFilter).toHaveBeenCalledTimes(1);
  });
});
