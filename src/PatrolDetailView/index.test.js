import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { executeSaveActions } from '../utils/save';
import { hidePatrolDetailView } from '../ducks/patrols';
import { mockStore } from '../__test-helpers/MockStore';
import { patrolDefaultStoreData } from '../__test-helpers/fixtures/patrols';
import PatrolDetailView from './';

jest.mock('../utils/save', () => ({
  ...jest.requireActual('../utils/save'),
  executeSaveActions: jest.fn(),
}));
jest.mock('../ducks/patrols', () => ({
  ...jest.requireActual('../ducks/patrols'),
  hidePatrolDetailView: jest.fn(),
}));

let store = patrolDefaultStoreData;
store.data.subjectStore = {};
store.data.user = { permissions: { patrol: ['change'] } };

describe('PatrolDetailView', () => {
  let executeSaveActionsMock, hidePatrolDetailViewMock;

  beforeEach(() => {
    hidePatrolDetailViewMock = jest.fn(() => () => {});
    hidePatrolDetailView.mockImplementation(hidePatrolDetailViewMock);

    render(
      <Provider store={mockStore(store)}>
        <PatrolDetailView />
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders the drawer in the Plan view by default', async () => {
    expect((await screen.findAllByRole('tab'))[0]).toHaveClass('active');
    expect((await screen.findAllByRole('tabpanel'))[0]).toHaveClass('show');
  });

  test('navigates to the Timeline view when user clicks the tab', async () => {
    const timelineTab = (await screen.findAllByRole('tab'))[1];

    expect(timelineTab).not.toHaveClass('active');

    userEvent.click(timelineTab);

    expect(timelineTab).toHaveClass('active');
    expect(await screen.findByRole('tabpanel')).toHaveClass('show');
  });

  test('navigates to the History view when user clicks the tab', async () => {
    const historyTab = (await screen.findAllByRole('tab'))[2];

    expect(historyTab).not.toHaveClass('active');

    userEvent.click(historyTab);

    expect(historyTab).toHaveClass('active');
    expect(await screen.findByRole('tabpanel')).toHaveClass('show');
  });

  test('updates the title when user types in it', async () => {
    const titleInput = (await screen.findAllByRole('textbox'))[0];

    // Couldn't mock the patrol types to get the expected display title
    expect(titleInput).toHaveAttribute('value', 'Unknown patrol type');

    userEvent.type(titleInput, '2');

    expect(titleInput).toHaveAttribute('value', 'Unknown patrol type2');
  });

  test('closes the drawer when clicking the exit button', async () => {
    expect(hidePatrolDetailView).toHaveBeenCalledTimes(0);

    const exitButton = await screen.findByText('Exit');
    userEvent.click(exitButton);

    expect(hidePatrolDetailView).toHaveBeenCalledTimes(1);
  });

  test('renders the save button when user is in the Plan tab', async () => {
    expect((await screen.findByText('Save'))).toBeDefined();
  });

  test('does not render the save button when user is in the Timeline tab', async () => {
    const timelineTab = (await screen.findAllByRole('tab'))[1];
    userEvent.click(timelineTab);

    expect((await screen.queryByText('Save'))).toBeNull();
  });

  test('does not render the save button when user is in the History tab', async () => {
    const historyTab = (await screen.findAllByRole('tab'))[2];
    userEvent.click(historyTab);

    expect((await screen.queryByText('Save'))).toBeNull();
  });

  test('triggers executeSaveActions when user clicks the Save button and calls for closing the detail view', async () => {
    executeSaveActionsMock = jest.fn(() => Promise.resolve());
    executeSaveActions.mockImplementation(executeSaveActionsMock);

    expect(executeSaveActions).toHaveBeenCalledTimes(0);
    expect(hidePatrolDetailView).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    await waitFor(() => {
      expect(executeSaveActions).toHaveBeenCalledTimes(1);
      expect(hidePatrolDetailView).toHaveBeenCalledTimes(1);
    });
  });
});
