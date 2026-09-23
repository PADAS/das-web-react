import React, { useState } from 'react';
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
  let onClose, store, track;

  beforeEach(() => {
    onClose = jest.fn();
    track = jest.fn();
    updatePatrolFilter.mockImplementation(() => () => {});

    store = {
      data: {
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
          { display: 'Dog Patrol', icon_id: 'dog-patrol-icon', id: 'dog-patrol-id', value: 'dog_patrol' },
          { display: 'Fence Patrol', icon_id: 'fence-patrol-icon', id: 'fence-patrol-id', value: 'fence_patrol' },
        ],
      },
    };
  });

  const FiltersPopoverWithTrigger = () => {
    const [trigger, setTrigger] = useState(null);

    return <>
      <button ref={setTrigger} type="button">Filters</button>

      <button type="button">Outside</button>

      {!!trigger && <FiltersPopover onClose={onClose} trigger={trigger} />}
    </>;
  };

  const renderFiltersPopover = () => render(
    <Provider store={mockStore(store)}>
      <TrackerContext.Provider value={{ track }}>
        <FiltersPopoverWithTrigger />
      </TrackerContext.Provider>
    </Provider>
  );

  const teamLeadSelect = () => screen.getByRole('combobox', { name: 'Team Lead' });

  const statusGroup = () => within(screen.getByRole('group', { name: 'Status' }));

  const patrolTypeGroup = () => within(screen.getByRole('group', { name: 'Patrol Type' }));

  test('opens as a modal dialog named after the patrol filters', () => {
    renderFiltersPopover();

    expect(screen.getByRole('dialog', { name: 'Patrol Filters' })).toHaveAttribute('aria-modal', 'true');
  });

  test('shows the team lead, status and patrol type fields and nothing else while no filter is set', () => {
    renderFiltersPopover();

    expect(teamLeadSelect()).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Patrol Type' })).toBeInTheDocument();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(within(screen.getByRole('dialog')).queryByRole('button')).toBeNull();
  });

  test('focuses itself rather than a field when it opens', () => {
    renderFiltersPopover();

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  test('shows the team leads in the filter', () => {
    store.data.patrolFilter.filter.tracked_by = ['Leader 2'];

    renderFiltersPopover();

    expect(screen.getByRole('dialog')).toHaveTextContent('Bravo');
  });

  test('shows a team lead selection whose leader is no longer offered as an unknown team lead', () => {
    store.data.patrolFilter.filter.tracked_by = ['Leader 1', 'Retired leader'];

    renderFiltersPopover();

    expect(screen.getByRole('dialog')).toHaveTextContent('Alpha');
    expect(screen.getByRole('dialog')).toHaveTextContent('Unknown team lead');
  });

  test('removes an unknown team lead from the filter when the user clears it', async () => {
    store.data.patrolFilter.filter.tracked_by = ['Retired leader'];

    renderFiltersPopover();

    teamLeadSelect().focus();

    await userEvent.keyboard('{Backspace}');

    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { tracked_by: [] } });
  });

  test('adds a team lead to the filter when the user picks one', async () => {
    store.data.patrolFilter.filter.tracked_by = ['Leader 1'];

    renderFiltersPopover();

    await userEvent.type(teamLeadSelect(), 'Bravo');
    await userEvent.keyboard('{Enter}');

    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { tracked_by: ['Leader 1', 'Leader 2'] } });
    expect(track).toHaveBeenCalledWith('Set the team lead filter');
  });

  test('clears the team lead filter when the user removes every team lead', async () => {
    store.data.patrolFilter.filter.tracked_by = ['Leader 1'];

    renderFiltersPopover();

    teamLeadSelect().focus();

    await userEvent.keyboard('{Backspace}');

    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { tracked_by: [] } });
    expect(track).toHaveBeenCalledWith('Clear the team lead filter');
  });

  test('does not offer an all option in its checkbox lists', () => {
    renderFiltersPopover();

    expect(screen.queryByRole('checkbox', { name: 'All' })).toBeNull();
  });

  test('leaves every status unchecked while the status filter is empty', () => {
    renderFiltersPopover();

    statusGroup().getAllByRole('checkbox').forEach((checkbox) => expect(checkbox).not.toBeChecked());
  });

  test('adds a status to the filter when the user checks it', async () => {
    renderFiltersPopover();

    await userEvent.click(statusGroup().getByRole('checkbox', { name: 'Done' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({ status: ['done'] });
    expect(track).toHaveBeenCalledWith('Set the status filter');
  });

  test('removes a status from the filter when the user unchecks it', async () => {
    store.data.patrolFilter.status = ['active', 'done'];

    renderFiltersPopover();

    await userEvent.click(statusGroup().getByRole('checkbox', { name: 'Active' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({ status: ['done'] });
  });

  test('adds a patrol type to the filter when the user checks it', async () => {
    renderFiltersPopover();

    await userEvent.click(patrolTypeGroup().getByRole('checkbox', { name: 'Dog Patrol' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { patrol_type: ['dog-patrol-id'] } });
    expect(track).toHaveBeenCalledWith('Set the patrol types filter');
  });

  test('checks the patrol types the filter names by id', () => {
    store.data.patrolFilter.filter.patrol_type = ['fence-patrol-id'];

    renderFiltersPopover();

    expect(patrolTypeGroup().getByRole('checkbox', { name: 'Fence Patrol' })).toBeChecked();
    expect(patrolTypeGroup().getByRole('checkbox', { name: 'Dog Patrol' })).not.toBeChecked();
  });

  test('clears the patrol type filter when the user unchecks its last patrol type', async () => {
    store.data.patrolFilter.filter.patrol_type = ['dog-patrol-id'];

    renderFiltersPopover();

    await userEvent.click(patrolTypeGroup().getByRole('checkbox', { name: 'Dog Patrol' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { patrol_type: [] } });
  });

  test('does not offer to reset a checkbox list with nothing checked', () => {
    renderFiltersPopover();

    expect(screen.queryByRole('button', { name: 'Reset status' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reset patrol types' })).toBeNull();
  });

  test('clears the status filter and focuses its first checkbox when the user resets it', async () => {
    store.data.patrolFilter.status = ['done'];

    renderFiltersPopover();

    await userEvent.click(screen.getByRole('button', { name: 'Reset status' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({ status: INITIAL_FILTER_STATE.status });
    expect(statusGroup().getByRole('checkbox', { name: 'Active' })).toHaveFocus();
  });

  test('clears the patrol type filter and focuses its first checkbox when the user resets it', async () => {
    store.data.patrolFilter.filter.patrol_type = ['fence-patrol-id'];

    renderFiltersPopover();

    await userEvent.click(screen.getByRole('button', { name: 'Reset patrol types' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({
      filter: { patrol_type: INITIAL_FILTER_STATE.filter.patrol_type },
    });
    expect(patrolTypeGroup().getByRole('checkbox', { name: 'Dog Patrol' })).toHaveFocus();
    expect(track).toHaveBeenCalledWith('Click reset the patrol types filter');
  });

  test('clears a patrol type filter with no patrol types listed and focuses itself when the user resets it', async () => {
    store.data.patrolFilter.filter.patrol_type = ['fence-patrol-id'];
    store.data.patrolTypes = [];

    renderFiltersPopover();

    await userEvent.click(screen.getByRole('button', { name: 'Reset patrol types' }));

    expect(updatePatrolFilter).toHaveBeenCalledWith({
      filter: { patrol_type: INITIAL_FILTER_STATE.filter.patrol_type },
    });
    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  test('reaches a reset button before the checkboxes it clears when the user tabs', async () => {
    store.data.patrolFilter.status = ['done'];

    renderFiltersPopover();

    teamLeadSelect().focus();

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Reset status' })).toHaveFocus();
  });

  test('moves focus from its last field back to the first when the user tabs past it', async () => {
    renderFiltersPopover();

    patrolTypeGroup().getByRole('checkbox', { name: 'Fence Patrol' }).focus();

    await userEvent.tab();

    expect(teamLeadSelect()).toHaveFocus();
  });

  test('moves focus from its first field to the last when the user tabs backwards past it', async () => {
    renderFiltersPopover();

    teamLeadSelect().focus();

    await userEvent.tab({ shift: true });

    expect(patrolTypeGroup().getByRole('checkbox', { name: 'Fence Patrol' })).toHaveFocus();
  });

  test('brings focus resting on the dialog itself to its first field when the user tabs', async () => {
    renderFiltersPopover();

    await userEvent.tab();

    expect(teamLeadSelect()).toHaveFocus();
  });

  test('moves focus between its fields in order when the user tabs', async () => {
    renderFiltersPopover();

    teamLeadSelect().focus();

    await userEvent.tab();

    expect(statusGroup().getByRole('checkbox', { name: 'Active' })).toHaveFocus();
  });

  test('closes and returns focus to its trigger when the user presses escape', async () => {
    renderFiltersPopover();

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus();
  });

  test('stays open when the escape the user presses only closes the team lead menu', async () => {
    renderFiltersPopover();

    teamLeadSelect().focus();

    await userEvent.keyboard('{ArrowDown}');

    expect(teamLeadSelect()).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Escape}');

    expect(teamLeadSelect()).toHaveAttribute('aria-expanded', 'false');
    expect(onClose).not.toHaveBeenCalled();
  });

  test('closes when the user clicks outside it, leaving focus where the click landed', async () => {
    renderFiltersPopover();

    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
  });

  test('stays open when the user picks from the team lead menu', async () => {
    renderFiltersPopover();

    await userEvent.click(teamLeadSelect());
    await userEvent.click(await screen.findByText('Bravo'));

    expect(updatePatrolFilter).toHaveBeenCalledWith({ filter: { tracked_by: ['Leader 2'] } });
    expect(onClose).not.toHaveBeenCalled();
  });

  test('leaves a click on its trigger to the trigger', async () => {
    renderFiltersPopover();

    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(onClose).not.toHaveBeenCalled();
  });
});
