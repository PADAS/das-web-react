import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import eventCategories from '../__test-helpers/fixtures/event-categories';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { mockStore } from '../__test-helpers/MockStore';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import { PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../constants';
import { render, screen, waitFor } from '../test-utils';

import AddItemButton from './';

describe('AddItemButton', () => {
  let renderAddItemButton, store;
  beforeEach(() => {
    store = {
      data: {
        eventCategories,
        eventTypes,
        patrolTypes,
        user: {
          permissions: {
            [PERMISSION_KEYS.EVENTS]: [PERMISSIONS.CREATE],
            [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.CREATE],
          },
        },
      },
      view: {
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
          [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
        },
      },
    };

    renderAddItemButton = (props, overrideStore) => {
      render(
        <Provider store={mockStore({ ...store, ...overrideStore })}>
          <AddItemButton {...props} />
        </Provider>
      );
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('does not render if user cannot create events or patrols', async () => {
    store.data.user.permissions = {};
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS] = false;
    renderAddItemButton();

    expect(screen.queryByRole('button', { name: 'Create Event or Patrol' })).toBeNull();
  });

  test('hides patrol tab when user cannot create patrols', async () => {
    store.data.user.permissions[PERMISSION_KEYS.PATROLS] = [];
    renderAddItemButton();

    const addItemButton = await screen.findByTestId('addItemButton');
    await userEvent.click(addItemButton);

    const modal = await screen.findByTestId('addItemButton-addItemModal');
    expect(modal).toBeInTheDocument();

    const tabs = await screen.findAllByRole('tab');
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent('Add Event');
    expect(screen.queryByTestId('addItemButton-addItemModal-patrolTab')).not.toBeInTheDocument();
  });

  test('hides patrol tab when patrol management is disabled', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT] = false;
    renderAddItemButton();

    const addItemButton = await screen.findByTestId('addItemButton');
    await userEvent.click(addItemButton);

    const tabs = await screen.findAllByRole('tab');
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent('Add Event');
    expect(screen.queryByTestId('addItemButton-addItemModal-patrolTab')).not.toBeInTheDocument();
  });

  test('hides patrol tab when there are no patrol types', async () => {
    store.data.patrolTypes = [];
    renderAddItemButton();

    const addItemButton = await screen.findByTestId('addItemButton');
    await userEvent.click(addItemButton);

    const tabs = await screen.findAllByRole('tab');
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent('Add Event');
    expect(screen.queryByTestId('addItemButton-addItemModal-patrolTab')).not.toBeInTheDocument();
  });

  test('hides event tab when events are disabled even', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS] = false;
    renderAddItemButton();

    const addItemButton = await screen.findByTestId('addItemButton');
    await userEvent.click(addItemButton);

    const tabs = await screen.findAllByRole('tab');
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent('Add Patrol');
    expect(screen.queryByTestId('addItemButton-addItemModal-reportTab')).not.toBeInTheDocument();
  });

  test('hides event tab when there are no event types', async () => {
    store.data.eventTypes = [];
    renderAddItemButton();

    const addItemButton = await screen.findByTestId('addItemButton');
    await userEvent.click(addItemButton);

    const tabs = await screen.findAllByRole('tab');
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent('Add Patrol');
    expect(screen.queryByTestId('addItemButton-addItemModal-reportTab')).not.toBeInTheDocument();
  });

  test('shows the Add Modal when clicking the button', async () => {
    renderAddItemButton();

    expect((await screen.queryByTestId('addItemButton-addItemModal'))).toBeNull();

    const addItemButton = screen.getByRole('button', { name: 'Create Event or Patrol' });
    await userEvent.click(addItemButton);

    expect((await screen.findByTestId('addItemButton-addItemModal'))).toBeDefined();
  });

  test('hides the Add Modal', async () => {
    renderAddItemButton();

    const addItemButton = await screen.findByTestId('addItemButton');
    await userEvent.click(addItemButton);

    expect((await screen.findByTestId('addItemButton-addItemModal'))).toBeDefined();

    const closeButton = await screen.findByLabelText('Close');
    await userEvent.click(closeButton);

    await waitFor(async () => {
      expect((await screen.queryByTestId('addItemButton-addItemModal'))).toBeNull();
    });
  });

  test('shows the default button title', async () => {
    renderAddItemButton();

    expect((await screen.findByText('Create'))).toBeDefined();
  });

  test('shows a custom button title', async () => {
    renderAddItemButton({ title: 'Title' });

    expect((await screen.findByText('Title'))).toBeDefined();
  });

  test('hides the button title', async () => {
    renderAddItemButton({ showLabel: false, title: 'Title' });

    expect((await screen.queryByText('Title'))).toBeNull();
  });

  test('triggers onAddReport when clicking a report type button if it is defined', async () => {
    const onAddReport = jest.fn();

    renderAddItemButton({ onAddReport });

    const addItemButton = await screen.findByTestId('addItemButton');
    await userEvent.click(addItemButton);

    expect(onAddReport).toHaveBeenCalledTimes(0);

    const reportTypeButton = await screen.findByTestId('categoryList-button-74941f0d-4b89-48be-a62a-a74c78db8383');
    await userEvent.click(reportTypeButton);

    expect(onAddReport).toHaveBeenCalledTimes(1);
    expect(onAddReport.mock.calls[0][2]).toBe('74941f0d-4b89-48be-a62a-a74c78db8383');
  });

  test('triggers onAddPatrol when clicking a patrol type button if it is defined', async () => {
    const onAddPatrol = jest.fn();

    renderAddItemButton({ onAddPatrol });

    const addItemButton = await screen.findByTestId('addItemButton');
    await userEvent.click(addItemButton);

    expect(onAddPatrol).toHaveBeenCalledTimes(0);

    const addPatrolTab = (await screen.findAllByRole('tab'))[1];
    await userEvent.click(addPatrolTab);
    // Prototype uses 'Vehicle Patrol' as the first patrol type id.
    const patrolTypeButton = await screen.findByTestId('categoryList-button-Vehicle Patrol');
    await userEvent.click(patrolTypeButton);

    expect(onAddPatrol).toHaveBeenCalledTimes(1);
    expect(onAddPatrol.mock.calls[0][2]).toBe('Vehicle Patrol');
  });

  test('it shows the AddItemButton even if there are no patrol info', async () => {
    renderAddItemButton(undefined, { data: { ...store.data, patrolTypes: [] } });
    const addItemButton = await screen.findByTestId('addItemButton');
    expect(addItemButton).toBeInTheDocument();
  });

  test('it hides the AddItemButton when there are no information to show', async () => {
    const something = { data: { ...store.data, eventTypes: [], patrolTypes: [] } };
    renderAddItemButton(undefined, something);
    const addItemButton = await screen.queryByTestId('addItemButton');
    expect(addItemButton).not.toBeInTheDocument();
  });
});
