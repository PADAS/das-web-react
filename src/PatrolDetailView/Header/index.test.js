import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Header from './';
import { mockStore } from '../../__test-helpers/MockStore';
import {
  newPatrol,
  scheduledPatrol,
  activePatrol,
  overduePatrol,
  donePatrol,
  cancelledPatrol,
  patrolDefaultStoreData
} from '../../__test-helpers/fixtures/patrols';
import { updatePatrol } from '../../ducks/patrols';

jest.mock('../../ducks/patrols', () => ({
  ...jest.requireActual('../../ducks/patrols'),
  updatePatrol: jest.fn(),
}));

const store = mockStore(patrolDefaultStoreData);

describe('Header', () => {
  const onChangeTitle = jest.fn(), setRedirectTo = jest.fn();
  let updatePatrolMock;
  beforeEach(() => {
    updatePatrolMock = jest.fn(() => () => {});
    updatePatrol.mockImplementation(updatePatrolMock);
  });

  const renderHeader = (overwriteProps) => {
    return render(
      <Provider store={store}>
        <Header onChangeTitle={onChangeTitle} patrol={newPatrol} setRedirectTo={setRedirectTo} {...overwriteProps} />
      </Provider>
    );
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders correctly case of a new patrol', async () => {
    renderHeader();

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toBeNull();
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toBeNull();
  });

  test('renders correctly case of a scheduled patrol', async () => {
    renderHeader({ patrol: scheduledPatrol });

    const buttons = await screen.findAllByRole('button');

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toHaveTextContent('Scheduled');
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toHaveTextContent('Scheduled');
    expect(buttons[0]).toHaveTextContent('Start');
    expect(buttons[1]).toHaveClass('kebabToggle');
  });

  test('renders correctly case of an active patrol', async () => {
    renderHeader({ patrol: activePatrol });

    const buttons = await screen.findAllByRole('button');

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toBeDefined();
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toHaveTextContent('Active');
    expect(buttons[0]).toHaveClass('kebabToggle');
  });

  test('renders correctly case of an overdue patrol', async () => {
    renderHeader({ patrol: overduePatrol });

    const buttons = await screen.findAllByRole('button');

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toHaveTextContent('Scheduled');
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toHaveTextContent('Start Overdue');
    expect(buttons[0]).toHaveTextContent('Start');
    expect(buttons[1]).toHaveClass('kebabToggle');
  });

  test('renders correctly case of an done patrol', async () => {
    renderHeader({ patrol: donePatrol });

    const buttons = await screen.findAllByRole('button');

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toBeDefined();
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toHaveTextContent('Done');
    expect(buttons[0]).toHaveClass('kebabToggle');
  });

  test('renders correctly case of an cancelled patrol', async () => {
    renderHeader({ patrol: cancelledPatrol });

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toHaveTextContent('Scheduled');
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toHaveTextContent('Cancelled');
    expect((await screen.findByRole('button'))).toHaveTextContent('Restore');
  });

  test('triggers setTitle callback when the contenteditable loses focus', async () => {
    renderHeader({ patrol: scheduledPatrol });

    const titleTextBox = await screen.findByTestId('patrolDetailView-header-title');
    userEvent.type(titleTextBox, '{del}{del}{del}{del}{del}{del}2');
    userEvent.tab();

    await waitFor(() => {
      expect(onChangeTitle).toHaveBeenCalledTimes(1);
      expect(onChangeTitle).toHaveBeenCalledWith('2');
    });
  });

  test('sets the display title if user leaves the title input empty', async () => {
    renderHeader({ patrol: scheduledPatrol });

    const titleTextBox = await screen.findByTestId('patrolDetailView-header-title');
    userEvent.type(titleTextBox, '{del}{del}{del}{del}{del}{del}');
    userEvent.tab();

    expect(onChangeTitle).toHaveBeenCalledTimes(1);
    expect(onChangeTitle).toHaveBeenCalledWith('Future');
  });

  test('triggers startPatrol callback when clicking the start button and redirects to feed', async () => {
    renderHeader({ patrol: scheduledPatrol });

    expect(updatePatrolMock).toHaveBeenCalledTimes(0);
    expect(setRedirectTo).toHaveBeenCalledTimes(0);

    const buttons = await screen.findAllByRole('button');
    userEvent.click(buttons[0]);

    expect(updatePatrolMock).toHaveBeenCalledTimes(1);
    expect(updatePatrolMock.mock.calls[0][0].state).toBe('open');
    expect(setRedirectTo).toHaveBeenCalledTimes(1);
    expect(setRedirectTo).toHaveBeenCalledWith('/patrols');
  });

  test('triggers restorePatrol callback when clicking the restore button and redirects to feed', async () => {
    renderHeader({ patrol: cancelledPatrol });

    expect(updatePatrolMock).toHaveBeenCalledTimes(0);
    expect(setRedirectTo).toHaveBeenCalledTimes(0);

    const restorePatrolButton = await screen.findByRole('button');
    userEvent.click(restorePatrolButton);

    expect(updatePatrolMock).toHaveBeenCalledTimes(1);
    expect(updatePatrolMock.mock.calls[0][0].state).toBe('open');
    expect(setRedirectTo).toHaveBeenCalledTimes(1);
    expect(setRedirectTo).toHaveBeenCalledWith('/patrols');
  });
});
