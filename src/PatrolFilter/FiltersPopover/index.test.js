import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fetchTrackedBySchema } from '../../ducks/trackedby';
import FiltersPopover from '.';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../ducks/patrol-filter';
import { mockStore } from '../../__test-helpers/MockStore';
import { render, screen, within } from '../../test-utils';

jest.mock('../../ducks/trackedby', () => ({
  ...jest.requireActual('../../ducks/trackedby'),
  fetchTrackedBySchema: jest.fn(),
}));
jest.mock('../../ducks/patrol-filter', () => ({
  ...jest.requireActual('../../ducks/patrol-filter'),
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
  let fetchTrackedBySchemaMock, store, updatePatrolFilterMock;
  beforeEach(() => {
    fetchTrackedBySchemaMock = jest.fn(() => () => {});
    fetchTrackedBySchema.mockImplementation(fetchTrackedBySchemaMock);
    updatePatrolFilterMock = jest.fn(() => () => {});
    updatePatrolFilter.mockImplementation(updatePatrolFilterMock);

    store = {
      data: {
        eventSchemas: {
          globalSchema: {
            properties: {
              reported_by: {
                enum_ext: [{
                  value: { id: 'Leader 1' },
                }, {
                  value: { id: 'Leader 2' },
                }],
              },
            },
          },
        },
        patrolFilter: {
          filter: {
            tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
            patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
          },
          status: INITIAL_FILTER_STATE.status,
        },
        patrolLeaderSchema: {
          trackedbySchema: {
            properties: {
              leader: {
                enum_ext: [{
                  value: { id: 'Leader 1' },
                }, {
                  value: { id: 'Leader 2' },
                }],
              },
            },
          },
        },
        patrolTypes: [{
          display: 'Dog Patrol',
          icon_id: 'dog-patrol-icon',
          id: 'dog_patrol',
        }, {
          display: 'Fence Patrol',
          icon_id: 'fence-patrol-icon',
          id: 'fence_patrol',
        }],
        subjectStore: {},
      },
    };
  });

  test('shows the Reset All button if any filter was modified', async () => {
    store.data.patrolFilter.filter.tracked_by = ['Leader 1'];
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    await screen.findByText('Reset All');
  });

  test('does not show the Reset All button if the filters have not been modified', async () => {
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect((await screen.queryByText('Reset All'))).toBeNull();
  });

  test('resets the filters when user clicks the Reset All button', async () => {
    store.data.patrolFilter.filter.tracked_by = ['Leader 1'];
    store.data.patrolFilter.filter.patrol_type = ['dog_patrol'];
    store.data.patrolFilter.status = ['active'];
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    const resetFiltersButton = await screen.findByText('Reset All');
    userEvent.click(resetFiltersButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({
      filter: {
        tracked_by: INITIAL_FILTER_STATE.filter.tracked_by,
        patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
      },
      status: INITIAL_FILTER_STATE.status,
    });
  });

  test('updates the patrol filter when user chooses a leader', async () => {
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const leadersSelect = await screen.findByRole('combobox');
    userEvent.type(leadersSelect, 'Leader 1');
    userEvent.keyboard('{Enter}');

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { tracked_by: ['Leader 1'] } });
  });

  test('updates the patrol filter when user chooses a second leader', async () => {
    store.data.patrolFilter.filter.tracked_by = ['Leader 1'];
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    const leadersSelect = await screen.findByRole('combobox');
    userEvent.type(leadersSelect, 'Leader 2');
    userEvent.keyboard('{Enter}');

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { tracked_by: ['Leader 1', 'Leader 2'] } });
  });

  test('shows the reset leaders button if the there is at least one leader selected', async () => {
    store.data.patrolFilter.filter.tracked_by = ['Leader 1'];
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    const resetLeadersButton = await screen.findByTestId('patrolFilter-reset-leaders-button');

    expect(resetLeadersButton.className).not.toEqual(expect.stringContaining('hidden'));
  });

  test('hides the reset leaders button if there are no leaders selected', async () => {
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );
    const resetLeadersButton = await screen.findByTestId('patrolFilter-reset-leaders-button');

    expect(resetLeadersButton.className).toEqual(expect.stringContaining('hidden'));
  });

  test('resets the leaders filter when user clicks the Reset button', async () => {
    store.data.patrolFilter.filter.tracked_by = ['Leader 1'];
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const resetLeadersButton = await screen.findByTestId('patrolFilter-reset-leaders-button');
    userEvent.click(resetLeadersButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { tracked_by: INITIAL_FILTER_STATE.filter.tracked_by } });
  });

  test('updates the patrol filter when user checks a status', async () => {
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const statusCheckboxList = await screen.findByTestId('patrolFilter-status-checkbox-list');
    const activeStatusCheckbox = (await within(statusCheckboxList).findAllByRole('checkbox'))[1];
    userEvent.click(activeStatusCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ status: ['active'] });
  });

  test('updates the patrol filter when user checks a second status', async () => {
    store.data.patrolFilter.status = ['active'];
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const statusCheckboxList = await screen.findByTestId('patrolFilter-status-checkbox-list');
    const cancelledStatusCheckbox = (await within(statusCheckboxList).findAllByRole('checkbox'))[3];
    userEvent.click(cancelledStatusCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ status: ['active', 'cancelled'] });
  });

  test('updates the patrol filter when user clicks the All status option', async () => {
    store.data.patrolFilter.status = ['active'];
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    const statusCheckboxList = await screen.findByTestId('patrolFilter-status-checkbox-list');
    const allStatusCheckbox = (await within(statusCheckboxList).findAllByRole('checkbox'))[0];
    userEvent.click(allStatusCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ status: [] });
  });

  test('shows the reset status button if the there is at least status type selected', async () => {
    store.data.patrolFilter.status = ['active'];
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    const resetStatusButton = await screen.findByTestId('patrolFilter-reset-status-button');

    expect(resetStatusButton.className).not.toEqual(expect.stringContaining('hidden'));
  });

  test('hides the reset status button if there are no status selected', async () => {
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    const resetStatusButton = await screen.findByTestId('patrolFilter-reset-status-button');

    expect(resetStatusButton.className).toEqual(expect.stringContaining('hidden'));
  });

  test('resets the status when user clicks the Reset button', async () => {
    store.data.patrolFilter.status = ['active'];
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const resetStatusButton = await screen.findByTestId('patrolFilter-reset-status-button');
    userEvent.click(resetStatusButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ status: INITIAL_FILTER_STATE.status });
  });

  test('updates the patrol filter when user checks a patrol type', async () => {
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const patrolTypeCheckboxList = await screen.findByTestId('patrolFilter-patrol-type-checkbox-list');
    const dogPatrolTypeCheckbox = (await within(patrolTypeCheckboxList).findAllByRole('checkbox'))[1];
    userEvent.click(dogPatrolTypeCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { patrol_type: ['dog_patrol'] } });
  });

  test('updates the patrol filter when user checks a second patrol type', async () => {
    store.data.patrolFilter.filter.patrol_type = ['dog_patrol'];
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const patrolTypeCheckboxList = await screen.findByTestId('patrolFilter-patrol-type-checkbox-list');
    const fencePatrolTypeCheckbox = (await within(patrolTypeCheckboxList).findAllByRole('checkbox'))[2];
    userEvent.click(fencePatrolTypeCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { patrol_type: ['dog_patrol', 'fence_patrol'] } });
  });

  test('updates the patrol filter when user clicks the All option', async () => {
    store.data.patrolFilter.filter.patrol_type = ['dog_patrol'];
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const patrolTypeCheckboxList = await screen.findByTestId('patrolFilter-patrol-type-checkbox-list');
    const allPatrolTypeCheckbox = (await within(patrolTypeCheckboxList).findAllByRole('checkbox'))[0];
    userEvent.click(allPatrolTypeCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { patrol_type: [] } });
  });

  test('shows the reset patrol types button if the there is at least one patrol type selected', async () => {
    store.data.patrolFilter.filter.patrol_type = ['dog_patrol'];
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    const resetPatrolTypeButton = await screen.findByTestId('patrolFilter-reset-patrol-type-button');

    expect(resetPatrolTypeButton.className).not.toEqual(expect.stringContaining('hidden'));
  });

  test('hides the reset patrol type button if there are no patrol types selected', async () => {
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );
    const resetPatrolTypeButton = await screen.findByTestId('patrolFilter-reset-patrol-type-button');

    expect(resetPatrolTypeButton.className).toEqual(expect.stringContaining('hidden'));
  });

  test('resets the patrol types filter when user clicks the Reset button', async () => {
    store.data.patrolFilter.filter.patrol_type = ['dog_patrol'];
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const resetPatrolTypesButton = await screen.findByTestId('patrolFilter-reset-patrol-type-button');
    userEvent.click(resetPatrolTypesButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({
      filter: { patrol_type: INITIAL_FILTER_STATE.filter.patrol_type },
    });
  });
});
