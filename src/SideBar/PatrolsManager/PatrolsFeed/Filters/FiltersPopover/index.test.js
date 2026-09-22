import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../../../../ducks/patrol-filter';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { render, screen, within } from '../../../../../test-utils';
import { TrackerContext } from '../../../../../utils/analytics';

import FiltersPopover from './';

jest.mock('../../../../../ducks/patrol-filter', () => ({
  ...jest.requireActual('../../../../../ducks/patrol-filter'),
  updatePatrolFilter: jest.fn(),
}));

describe('SideBar - PatrolsManager - PatrolsFeed - Filters - FiltersPopover', () => {
  let store;

  beforeEach(() => {
    updatePatrolFilter.mockImplementation(() => () => {});

    store = {
      data: {
        eventSchemas: {
          globalSchema: {
            properties: {
              reported_by: { enum_ext: [{ value: { id: 'Leader 1' } }, { value: { id: 'Leader 2' } }] },
            },
          },
        },
        patrolFilter: {
          filter: {
            patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
            tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
          },
          status: INITIAL_FILTER_STATE.status,
        },
        patrolTeamAndTrackingOptions: {
          leaders: [{ id: 'Leader 1', name: 'Alpha' }, { id: 'Leader 2', name: 'Bravo' }],
        },
        patrolTypes: [
          { display: 'Dog Patrol', icon_id: 'dog-patrol-icon', id: 'dog_patrol' },
          { display: 'Fence Patrol', icon_id: 'fence-patrol-icon', id: 'fence_patrol' },
        ],
        subjectStore: {},
      },
    };
  });

  const renderFiltersPopover = () => render(
    <Provider store={mockStore(store)}>
      <TrackerContext.Provider value={{ track: jest.fn() }}>
        <FiltersPopover />
      </TrackerContext.Provider>
    </Provider>
  );

  const statusGroup = () => within(screen.getByRole('group', { name: 'Status' }));

  const patrolTypeGroup = () => within(screen.getByRole('group', { name: 'Patrol Type' }));

  test('groups every filter under a named heading', () => {
    renderFiltersPopover();

    expect(screen.getByRole('group', { name: 'Tracked by' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Patrol Type' })).toBeInTheDocument();
  });

  test('checks the all option while nothing is selected', () => {
    renderFiltersPopover();

    expect(statusGroup().getByRole('checkbox', { name: 'All' })).toBeChecked();
    expect(statusGroup().getByRole('checkbox', { name: 'Active' })).not.toBeChecked();
  });

  test('adds a status to the filter when the user checks it', async () => {
    renderFiltersPopover();

    await userEvent.click(statusGroup().getByRole('checkbox', { name: 'Done' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({ status: ['done'] });
  });

  test('removes a status from the filter when the user unchecks it', async () => {
    store.data.patrolFilter.status = ['active', 'done'];

    renderFiltersPopover();

    await userEvent.click(statusGroup().getByRole('checkbox', { name: 'Active' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({ status: ['done'] });
  });

  test('clears the status filter when the user checks the all option', async () => {
    store.data.patrolFilter.status = ['active'];

    renderFiltersPopover();

    await userEvent.click(statusGroup().getByRole('checkbox', { name: 'All' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({ status: [] });
  });

  test('adds a patrol type to the filter when the user checks it', async () => {
    renderFiltersPopover();

    await userEvent.click(patrolTypeGroup().getByRole('checkbox', { name: 'Dog Patrol' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { patrol_type: ['dog_patrol'] } });
  });

  test('shows the reset all button only once a filter has been modified', () => {
    renderFiltersPopover();

    expect(screen.queryByRole('button', { name: 'Reset All' })).toBeNull();
  });

  test('resets every filter when the user clicks the reset all button', async () => {
    store.data.patrolFilter.filter.tracked_by = ['Leader 1'];
    store.data.patrolFilter.filter.patrol_type = ['dog_patrol'];
    store.data.patrolFilter.status = ['active'];

    renderFiltersPopover();

    await userEvent.click(screen.getByRole('button', { name: 'Reset All' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({
      filter: {
        patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
        tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
      },
      status: INITIAL_FILTER_STATE.status,
    });
  });

  test('resets a single filter from its own section', async () => {
    store.data.patrolFilter.status = ['active'];

    renderFiltersPopover();

    await userEvent.click(statusGroup().getByRole('button', { name: 'Reset' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({ status: INITIAL_FILTER_STATE.status });
  });

  test('does not offer to reset a filter that has not been modified', () => {
    renderFiltersPopover();

    expect(statusGroup().queryByRole('button', { name: 'Reset' })).toBeNull();
  });

  test('drops a tracked by selection whose leader is no longer offered', () => {
    store.data.patrolFilter.filter.tracked_by = ['Leader 1', 'Retired leader'];

    renderFiltersPopover();

    expect(screen.getByRole('group', { name: 'Tracked by' })).toHaveTextContent('Alpha');
    expect(screen.getByRole('group', { name: 'Tracked by' })).not.toHaveTextContent('Retired leader');
  });
});
