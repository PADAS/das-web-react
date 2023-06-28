import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AddModal, { ADD_TAB_KEYS, STORAGE_KEY } from './';
import { eventTypes } from '../../__test-helpers/fixtures/event-types';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { PERMISSION_KEYS, PERMISSIONS } from '../../constants';

jest.mock('../../constants', () => ({
  ...jest.requireActual('../../constants'),
  DEVELOPMENT_FEATURE_FLAGS: {
    ENABLE_PATROL_NEW_UI: true,
    ENABLE_REPORT_NEW_UI: true,
  },
}));

jest.mock('../../hooks', () => ({
  ...jest.requireActual('../../hooks'),
  useSystemConfigFlag: () => true,
}));

describe('AddButton - AddModal', () => {
  const onHide = jest.fn();
  let renderAddModal, store;
  beforeEach(() => {
    store = {
      data: { eventTypes, patrolTypes, user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.CREATE] } }, },
      view: { featureFlagOverrides: {} },
    };

    renderAddModal = (props, overrideStore) => {
      render(
        <Provider store={mockStore({ ...store, ...overrideStore })}>
          <NavigationWrapper>
            <AddModal onHide={onHide} show {...props} />
          </NavigationWrapper>
        </Provider>
      );
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('starts in the tab Add Report by default', async () => {
    renderAddModal();

    const tabs = await screen.findAllByRole('tab');

    expect(tabs[0]).toHaveTextContent('Add Report');
    expect(tabs[0]).toHaveClass('active');
    expect(tabs[1]).toHaveTextContent('Add Patrol');
    expect(tabs[1]).not.toHaveClass('active');
  });

  test('if it is defined, starts in the tab set by local storage', async () => {
    window.localStorage.setItem(STORAGE_KEY, ADD_TAB_KEYS.ADD_PATROL);

    renderAddModal();

    const tabs = await screen.findAllByRole('tab');

    expect(tabs[0]).toHaveTextContent('Add Report');
    expect(tabs[0]).not.toHaveClass('active');
    expect(tabs[1]).toHaveTextContent('Add Patrol');
    expect(tabs[1]).toHaveClass('active');

    window.localStorage.clear(STORAGE_KEY);
  });

  test('changes tabs when clicking', async () => {
    renderAddModal();

    const tabs = await screen.findAllByRole('tab');

    expect(tabs[0]).toHaveTextContent('Add Report');
    expect(tabs[0]).toHaveClass('active');
    expect(tabs[1]).toHaveTextContent('Add Patrol');
    expect(tabs[1]).not.toHaveClass('active');

    userEvent.click(tabs[1]);

    expect(tabs[0]).toHaveTextContent('Add Report');
    expect(tabs[0]).not.toHaveClass('active');
    expect(tabs[1]).toHaveTextContent('Add Patrol');
    expect(tabs[1]).toHaveClass('active');

    userEvent.click(tabs[0]);

    expect(tabs[0]).toHaveTextContent('Add Report');
    expect(tabs[0]).toHaveClass('active');
    expect(tabs[1]).toHaveTextContent('Add Patrol');
    expect(tabs[1]).not.toHaveClass('active');
  });

  test('changes to Add Report tab if Add Patrol is selected but patrols are not enabled', async () => {
    window.localStorage.setItem(STORAGE_KEY, ADD_TAB_KEYS.ADD_PATROL);

    renderAddModal({}, { data: { eventTypes, patrolTypes, user: { permissions: {} } } });

    const tabs = await screen.findAllByRole('tab');

    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent('Add Report');
    expect(tabs[0]).toHaveClass('active');

    window.localStorage.clear(STORAGE_KEY);
  });

  test('hides Add Patrol and switched to Add Report', async () => {
    window.localStorage.setItem(STORAGE_KEY, ADD_TAB_KEYS.ADD_PATROL);

    renderAddModal({ hideAddPatrolTab: true });

    const tabs = await screen.findAllByRole('tab');

    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent('Add Report');
    expect(tabs[0]).toHaveClass('active');

    window.localStorage.clear(STORAGE_KEY);
  });

  test('hides Add Report and switched to Add Patrol', async () => {
    window.localStorage.setItem(STORAGE_KEY, ADD_TAB_KEYS.ADD_REPORT);

    renderAddModal({ hideAddReportTab: true });

    const tabs = await screen.findAllByRole('tab');

    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent('Add Patrol');
    expect(tabs[0]).toHaveClass('active');

    window.localStorage.clear(STORAGE_KEY);
  });

  test('triggers onHide', async () => {
    renderAddModal();

    expect(onHide).toHaveBeenCalledTimes(0);

    const closeButton = await screen.findByLabelText('Close');
    userEvent.click(closeButton);

    expect(onHide).toHaveBeenCalledTimes(1);
  });

  test('triggers onAddReport when clicking a report type button if it is defined', async () => {
    const onAddReport = jest.fn();

    renderAddModal({ onAddReport });

    expect(onAddReport).toHaveBeenCalledTimes(0);

    const reportTypeButton = await screen.findByTestId('categoryList-button-74941f0d-4b89-48be-a62a-a74c78db8383');
    userEvent.click(reportTypeButton);

    expect(onAddReport).toHaveBeenCalledTimes(1);
    expect(onAddReport.mock.calls[0][2]).toBe('74941f0d-4b89-48be-a62a-a74c78db8383');
  });

  test('triggers onAddPatrol when clicking a patrol type button if it is defined', async () => {
    const onAddPatrol = jest.fn();

    renderAddModal({ onAddPatrol });

    expect(onAddPatrol).toHaveBeenCalledTimes(0);

    const addPatrolTab = (await screen.findAllByRole('tab'))[1];
    userEvent.click(addPatrolTab);
    const patrolTypeButton = await screen.findByTestId('categoryList-button-c6f88fd2-2b87-477a-9c23-3bc4b3eb845d');
    userEvent.click(patrolTypeButton);

    expect(onAddPatrol).toHaveBeenCalledTimes(1);
    expect(onAddPatrol.mock.calls[0][2]).toBe('c6f88fd2-2b87-477a-9c23-3bc4b3eb845d');
  });
});
