import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AddItemButton from './';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import { PERMISSION_KEYS, PERMISSIONS } from '../constants';

jest.mock('../constants', () => ({
  ...jest.requireActual('../constants'),
  DEVELOPMENT_FEATURE_FLAGS: {
    ENABLE_PATROL_NEW_UI: true,
  },
}));

jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useSystemConfigFlag: () => true,
}));

describe('AddItemButton', () => {
  let renderAddItemButton, store;
  beforeEach(() => {
    store = {
      data: { eventTypes, patrolTypes, user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.CREATE] } }, },
      view: { featureFlagOverrides: {} },
    };

    renderAddItemButton = (props, overrideStore) => {
      render(
        <Provider store={mockStore({ ...store, ...overrideStore })}>
          <NavigationWrapper>
            <AddItemButton {...props} />
          </NavigationWrapper>
        </Provider>
      );
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the Add Modal when clicking the button', async () => {
    renderAddItemButton();

    expect((await screen.queryByTestId('addItemButton-addItemModal'))).toBeNull();

    const addItemButton = await screen.findByTestId('addItemButton');
    userEvent.click(addItemButton);

    expect((await screen.findByTestId('addItemButton-addItemModal'))).toBeDefined();
  });

  test('hides the Add Modal', async () => {
    renderAddItemButton();

    const addItemButton = await screen.findByTestId('addItemButton');
    userEvent.click(addItemButton);

    expect((await screen.findByTestId('addItemButton-addItemModal'))).toBeDefined();

    const closeButton = await screen.findByLabelText('Close');
    userEvent.click(closeButton);

    await waitFor(async () => {
      expect((await screen.queryByTestId('addItemButton-addItemModal'))).toBeNull();
    });
  });

  test('shows the default button title', async () => {
    renderAddItemButton();

    expect((await screen.findByText('Add'))).toBeDefined();
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
    userEvent.click(addItemButton);

    expect(onAddReport).toHaveBeenCalledTimes(0);

    const reportTypeButton = await screen.findByTestId('categoryList-button-74941f0d-4b89-48be-a62a-a74c78db8383');
    userEvent.click(reportTypeButton);

    expect(onAddReport).toHaveBeenCalledTimes(1);
    expect(onAddReport.mock.calls[0][2]).toBe('74941f0d-4b89-48be-a62a-a74c78db8383');
  });

  test('triggers onAddPatrol when clicking a patrol type button if it is defined', async () => {
    const onAddPatrol = jest.fn();

    renderAddItemButton({ onAddPatrol });

    const addItemButton = await screen.findByTestId('addItemButton');
    userEvent.click(addItemButton);

    expect(onAddPatrol).toHaveBeenCalledTimes(0);

    const addPatrolTab = (await screen.findAllByRole('tab'))[1];
    userEvent.click(addPatrolTab);
    const patrolTypeButton = await screen.findByTestId('categoryList-button-c6f88fd2-2b87-477a-9c23-3bc4b3eb845d');
    userEvent.click(patrolTypeButton);

    expect(onAddPatrol).toHaveBeenCalledTimes(1);
    expect(onAddPatrol.mock.calls[0][2]).toBe('c6f88fd2-2b87-477a-9c23-3bc4b3eb845d');
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
