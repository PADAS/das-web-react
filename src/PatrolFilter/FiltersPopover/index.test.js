import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fetchTrackedBySchema } from '../../ducks/trackedby';
import FiltersPopover from '.';
import { INITIAL_FILTER_STATE, updatePatrolFilter } from '../../ducks/patrol-filter';
import { mockStore } from '../../__test-helpers/MockStore';

jest.mock('../../ducks/trackedby', () => ({
  ...jest.requireActual('../../ducks/trackedby'),
  fetchTrackedBySchema: jest.fn(),
}));
jest.mock('../../ducks/patrol-filter', () => ({
  ...jest.requireActual('../../ducks/patrol-filter'),
  updatePatrolFilter: jest.fn(),
}));

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
            leaders: INITIAL_FILTER_STATE.filter.leaders,
            patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
            status: INITIAL_FILTER_STATE.filter.status,
          },
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

    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );
  });

  test('shows the Reset All button if any filter was modified', async () => {
    store.data.patrolFilter.filter.leaders = ['Leader 1'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    await screen.findByText('Reset All');
  });

  test('does not show the Reset All button if the filters have not been modified', async () => {
    expect((await screen.queryByText('Reset All'))).toBeNull();
  });

  test('resets the filters when user clicks the Reset All button', async () => {
    store.data.patrolFilter.filter.leaders = ['Leader 1'];
    store.data.patrolFilter.filter.patrol_type = ['dog_patrol'];
    store.data.patrolFilter.filter.status = ['active'];
    cleanup();
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
        leaders: INITIAL_FILTER_STATE.filter.leaders,
        patrol_type: INITIAL_FILTER_STATE.filter.patrol_type,
        status: INITIAL_FILTER_STATE.filter.status,
      },
    });
  });

  test('updates the patrol filter when user chooses a leader', async () => {
    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const leadersSelect = await screen.findByRole('textbox');
    userEvent.type(leadersSelect, 'Leader 1');
    userEvent.keyboard('{Enter}');

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { leaders: ['Leader 1'] } });
  });

  test('updates the patrol filter when user chooses a second leader', async () => {
    store.data.patrolFilter.filter.leaders = ['Leader 1'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    const leadersSelect = await screen.findByRole('textbox');
    userEvent.type(leadersSelect, 'Leader 2');
    userEvent.keyboard('{Enter}');

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { leaders: ['Leader 1', 'Leader 2'] } });
  });

  test('shows the reset leaders button if the there is at least one leader selected', async () => {
    store.data.patrolFilter.filter.leaders = ['Leader 1'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    const resetLeadersButton = (await screen.findAllByText('Reset'))[0];

    expect(resetLeadersButton.className).not.toEqual(expect.stringContaining('hidden'));
  });

  test('hides the reset leaders button if there are no leaders selected', async () => {
    const resetLeadersButton = (await screen.findAllByText('Reset'))[0];

    expect(resetLeadersButton.className).toEqual(expect.stringContaining('hidden'));
  });

  test('resets the leaders filter when user clicks the Reset button', async () => {
    store.data.patrolFilter.filter.leaders = ['Leader 1'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const resetLeadersButton = (await screen.findAllByText('Reset'))[0];
    userEvent.click(resetLeadersButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { leaders: INITIAL_FILTER_STATE.filter.leaders } });
  });

  test('updates the patrol filter when user checks a status', async () => {
    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const activeStatusCheckbox = (await screen.findAllByRole('checkbox'))[1];
    userEvent.click(activeStatusCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { status: ['active'] } });
  });

  test('updates the patrol filter when user checks a second status', async () => {
    store.data.patrolFilter.filter.status = ['active'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const overdueStatusCheckbox = (await screen.findAllByRole('checkbox'))[3];
    userEvent.click(overdueStatusCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { status: ['active', 'overdue'] } });
  });

  test('updates the patrol filter when user clicks the All status option', async () => {
    store.data.patrolFilter.filter.status = ['active'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    const allStatusCheckbox = (await screen.findAllByRole('checkbox'))[0];
    userEvent.click(allStatusCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { status: ['all'] } });
  });

  test('shows the reset status button if the there is at least status type selected', async () => {
    store.data.patrolFilter.filter.status = ['active'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    const resetStatusButton = (await screen.findAllByText('Reset'))[1];

    expect(resetStatusButton.className).not.toEqual(expect.stringContaining('hidden'));
  });

  test('hides the reset status button if there are no status selected', async () => {
    const resetStatusButton = (await screen.findAllByText('Reset'))[1];

    expect(resetStatusButton.className).toEqual(expect.stringContaining('hidden'));
  });

  test('resets the patrol types filter when user clicks the Reset button', async () => {
    store.data.patrolFilter.filter.status = ['active'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const resetStatusButton = (await screen.findAllByText('Reset'))[1];
    userEvent.click(resetStatusButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { status: INITIAL_FILTER_STATE.filter.status } });
  });

  test('updates the patrol filter when user checks a patrol type', async () => {
    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const dogPatrolTypeCheckbox = (await screen.findAllByRole('checkbox'))[7];
    userEvent.click(dogPatrolTypeCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { patrol_type: ['dog_patrol'] } });
  });

  test('updates the patrol filter when user checks a second patrol type', async () => {
    store.data.patrolFilter.filter.patrol_type = ['dog_patrol'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const fencePatrolTypeCheckbox = (await screen.findAllByRole('checkbox'))[8];
    userEvent.click(fencePatrolTypeCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { patrol_type: ['dog_patrol', 'fence_patrol'] } });
  });

  test('updates the patrol filter when user clicks the All option', async () => {
    store.data.patrolFilter.filter.patrol_type = ['dog_patrol'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const allPatrolTypeCheckbox = (await screen.findAllByRole('checkbox'))[6];
    userEvent.click(allPatrolTypeCheckbox);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { patrol_type: ['all'] } });
  });

  test('shows the reset patrol types button if the there is at least one patrol type selected', async () => {
    store.data.patrolFilter.filter.patrol_type = ['dog_patrol'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    const resetPatrolTypeButton = (await screen.findAllByText('Reset'))[2];

    expect(resetPatrolTypeButton.className).not.toEqual(expect.stringContaining('hidden'));
  });

  test('hides the reset patrol type button if there are no patrol types selected', async () => {
    const resetPatrolTypeButton = (await screen.findAllByText('Reset'))[2];

    expect(resetPatrolTypeButton.className).toEqual(expect.stringContaining('hidden'));
  });

  test('resets the patrol types filter when user clicks the Reset button', async () => {
    store.data.patrolFilter.filter.patrol_type = ['dog_patrol'];
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <FiltersPopover />
      </Provider>
    );

    expect(updatePatrolFilter).toHaveBeenCalledTimes(0);

    const resetPatrolTypesButton = (await screen.findAllByText('Reset'))[2];
    userEvent.click(resetPatrolTypesButton);

    expect(updatePatrolFilter).toHaveBeenCalledTimes(1);
    expect(updatePatrolFilter).toHaveBeenCalledWith({
      filter: { patrol_type: INITIAL_FILTER_STATE.filter.patrol_type },
    });
  });
});
