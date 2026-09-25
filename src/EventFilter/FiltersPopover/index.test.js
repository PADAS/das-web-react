import React, { useState } from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { INITIAL_FILTER_STATE, updateEventFilter } from '../../ducks/event-filter';
import { mockStore } from '../../__test-helpers/MockStore';
import { PREVIEW_FEATURES } from '../../constants';
import { render, screen, within } from '../../test-utils';
import { TrackerContext } from '../../utils/analytics';

import FiltersPopover from './';

jest.mock('../../ducks/event-filter', () => ({
  ...jest.requireActual('../../ducks/event-filter'),
  updateEventFilter: jest.fn(),
}));
jest.mock('../../SvgIcon', () => jest.fn(() => null));

const FENCE_EVENT_TYPE = {
  category: { display: 'Logistics', value: 'logistics' },
  display: 'Fence',
  id: 'fence-id',
  ordernum: 1,
  value: 'fence',
  version: 1,
};

describe('EventFilter - FiltersPopover', () => {
  let onClose, store, track;

  beforeEach(() => {
    onClose = jest.fn();
    track = jest.fn();
    updateEventFilter.mockImplementation(() => () => {});

    store = {
      data: {
        eventCategories: {},
        eventFilter: {
          filter: {
            event_type: INITIAL_FILTER_STATE.filter.event_type,
            priority: INITIAL_FILTER_STATE.filter.priority,
            reported_by: INITIAL_FILTER_STATE.filter.reported_by,
          },
          state: INITIAL_FILTER_STATE.state,
        },
        eventSchemas: {
          globalSchema: {
            properties: {
              reported_by: {
                enum_ext: [
                  { value: { id: 'reporter-1', name: 'Alpha' } },
                  { value: { id: 'reporter-2', name: 'Bravo' } },
                  { value: { content_type: 'accounts.user', first_name: 'Carla', id: 'user-1', last_name: 'Diaz' } },
                  { value: { hidden: true, id: 'hidden-reporter' } },
                ],
              },
            },
          },
        },
        eventTypes: [FENCE_EVENT_TYPE],
        subjectStore: {},
      },
      view: { systemConfig: { previewFeatures: {} } },
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

  const reportedBySelect = () => screen.getByRole('combobox', { name: 'Reported By' });

  const priorityGroup = () => within(screen.getByRole('group', { name: 'Priority' }));

  const stateGroup = () => within(screen.getByRole('group', { name: 'State' }));

  const getCheckboxLabels = (group) => group.getAllByRole('checkbox').map((checkbox) => checkbox.labels[0].textContent);

  test('opens as a modal dialog named after the event filters', () => {
    renderFiltersPopover();

    expect(screen.getByRole('dialog', { name: 'Event Filters' })).toHaveAttribute('aria-modal', 'true');
  });

  test('focuses itself rather than a field when it opens', () => {
    renderFiltersPopover();

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  test('does not offer a reset button while no filter is set', () => {
    renderFiltersPopover();

    expect(screen.queryByRole('button', { name: /^Reset/ })).toBeNull();
  });

  test('shows the reporters in the filter', () => {
    store.data.eventFilter.filter.reported_by = ['reporter-2', 'user-1'];

    renderFiltersPopover();

    expect(screen.getByRole('dialog')).toHaveTextContent('Bravo');
    expect(screen.getByRole('dialog')).toHaveTextContent('Carla Diaz');
  });

  test('shows a reporter selection that is no longer offered as an unknown reporter', () => {
    store.data.eventFilter.filter.reported_by = ['retired-reporter'];

    renderFiltersPopover();

    expect(screen.getByRole('dialog')).toHaveTextContent('Unknown reporter');
  });

  test('offers the reporters by name, leaving out the hidden ones', async () => {
    renderFiltersPopover();

    await userEvent.click(reportedBySelect());

    expect(screen.getAllByRole('option').map((option) => option.textContent))
      .toEqual(['Alpha', 'Bravo', 'Carla Diaz']);
  });

  test('offers the recent radios first, in a group of their own', async () => {
    store.data.subjectStore = {
      'radio-1': {
        id: 'reporter-2',
        last_position_date: new Date(Date.now() - 60000).toISOString(),
        name: 'Bravo',
        subject_subtype: 'ranger',
      },
    };

    renderFiltersPopover();

    await userEvent.click(reportedBySelect());

    expect(screen.getByText('Recent radios')).toBeVisible();
    expect(screen.getByText('All')).toBeVisible();
    expect(screen.getAllByRole('option').map((option) => option.textContent))
      .toEqual(['Bravo', 'Alpha', 'Carla Diaz']);
  });

  test('adds a reporter to the filter when the user picks one', async () => {
    store.data.eventFilter.filter.reported_by = ['reporter-1'];

    renderFiltersPopover();

    await userEvent.type(reportedBySelect(), 'Bravo');
    await userEvent.keyboard('{Enter}');

    expect(updateEventFilter).toHaveBeenCalledWith({ filter: { reported_by: ['reporter-1', 'reporter-2'] } });
    expect(track).toHaveBeenCalledWith('Set the reported by filter');
    expect(onClose).not.toHaveBeenCalled();
  });

  test('clears the reported by filter when the user removes every reporter', async () => {
    store.data.eventFilter.filter.reported_by = ['reporter-1'];

    renderFiltersPopover();

    reportedBySelect().focus();

    await userEvent.keyboard('{Backspace}');

    expect(updateEventFilter).toHaveBeenCalledWith({ filter: { reported_by: [] } });
    expect(track).toHaveBeenCalledWith('Clear the reported by filter');
  });

  test('stays open when the escape the user presses only closes the reported by menu', async () => {
    renderFiltersPopover();

    reportedBySelect().focus();

    await userEvent.keyboard('{ArrowDown}');

    expect(reportedBySelect()).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Escape}');

    expect(reportedBySelect()).toHaveAttribute('aria-expanded', 'false');
    expect(onClose).not.toHaveBeenCalled();
  });

  test('offers the active and resolved states as checkboxes while community input is disabled', () => {
    renderFiltersPopover();

    expect(getCheckboxLabels(stateGroup())).toEqual(['Active', 'Resolved']);
  });

  test('offers the in review state too while community input is enabled', () => {
    store.view.systemConfig.previewFeatures[PREVIEW_FEATURES.COMMUNITY_INPUT_ADMIN] = true;

    renderFiltersPopover();

    expect(getCheckboxLabels(stateGroup())).toEqual(['Active', 'In review', 'Resolved']);
  });

  test('checks the states the filter holds', () => {
    store.data.eventFilter.state = ['active', 'new', 'resolved'];

    renderFiltersPopover();

    expect(stateGroup().getByRole('checkbox', { name: 'Active' })).toBeChecked();
    expect(stateGroup().getByRole('checkbox', { name: 'Resolved' })).toBeChecked();
  });

  test('leaves every state unchecked while the state filter is empty', () => {
    store.data.eventFilter.state = null;

    renderFiltersPopover();

    expect(stateGroup().getByRole('checkbox', { name: 'Active' })).not.toBeChecked();
    expect(stateGroup().getByRole('checkbox', { name: 'Resolved' })).not.toBeChecked();
  });

  test('adds the states of a choice to the filter when the user checks it', async () => {
    renderFiltersPopover();

    await userEvent.click(stateGroup().getByRole('checkbox', { name: 'Resolved' }));

    expect(updateEventFilter).toHaveBeenCalledWith({ state: ['active', 'new', 'resolved'] });
    expect(track).toHaveBeenCalledWith('Set the state filter');
  });

  test('clears the state filter when the user unchecks its last state', async () => {
    renderFiltersPopover();

    await userEvent.click(stateGroup().getByRole('checkbox', { name: 'Active' }));

    expect(updateEventFilter).toHaveBeenCalledWith({ state: null });
    expect(track).toHaveBeenCalledWith('Clear the state filter');
  });

  test('restores the default state filter and focuses its first checkbox when the user resets it', async () => {
    store.data.eventFilter.state = ['resolved'];

    renderFiltersPopover();

    await userEvent.click(screen.getByRole('button', { name: 'Reset state' }));

    expect(updateEventFilter).toHaveBeenCalledWith({ state: INITIAL_FILTER_STATE.state });
    expect(stateGroup().getByRole('checkbox', { name: 'Active' })).toHaveFocus();
    expect(track).toHaveBeenCalledWith('Click reset the state filter');
  });

  test('adds a priority to the filter when the user checks it', async () => {
    renderFiltersPopover();

    await userEvent.click(priorityGroup().getByRole('checkbox', { name: 'Red' }));

    expect(updateEventFilter).toHaveBeenCalledWith({ filter: { priority: [300] } });
    expect(track).toHaveBeenCalledWith('Set the priority filter');
  });

  test('clears the priority filter when the user unchecks its last priority', async () => {
    store.data.eventFilter.filter.priority = [200];

    renderFiltersPopover();

    await userEvent.click(priorityGroup().getByRole('checkbox', { name: 'Amber' }));

    expect(updateEventFilter).toHaveBeenCalledWith({ filter: { priority: [] } });
    expect(track).toHaveBeenCalledWith('Clear the priority filter');
  });

  test('clears the priority filter and focuses its first checkbox when the user resets it', async () => {
    store.data.eventFilter.filter.priority = [100];

    renderFiltersPopover();

    await userEvent.click(screen.getByRole('button', { name: 'Reset priority' }));

    expect(updateEventFilter).toHaveBeenCalledWith({ filter: { priority: INITIAL_FILTER_STATE.filter.priority } });
    expect(priorityGroup().getByRole('checkbox', { name: 'Red' })).toHaveFocus();
    expect(track).toHaveBeenCalledWith('Click reset the priority filter');
  });

  test('sets the event type filter to the event types the user checks', async () => {
    renderFiltersPopover();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Fence' }));

    expect(updateEventFilter).toHaveBeenCalledWith({ filter: { event_type: [FENCE_EVENT_TYPE.id] } });
  });

  test('clears the event type filter, its search and focuses the search when the user resets it', async () => {
    store.data.eventFilter.filter.event_type = [FENCE_EVENT_TYPE.id];

    renderFiltersPopover();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search event types' }), 'Fence');
    await userEvent.click(screen.getByRole('button', { name: 'Reset event types' }));

    expect(updateEventFilter).toHaveBeenCalledWith({
      filter: { event_type: INITIAL_FILTER_STATE.filter.event_type },
    });
    expect(screen.getByRole('searchbox', { name: 'Search event types' })).toHaveValue('');
    expect(screen.getByRole('searchbox', { name: 'Search event types' })).toHaveFocus();
    expect(track).toHaveBeenCalledWith('Click reset the event types filter');
  });

  test('closes and returns focus to its trigger when the user presses escape', async () => {
    renderFiltersPopover();

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus();
  });

  test('closes when the user clicks outside it', async () => {
    renderFiltersPopover();

    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
