import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
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
  const onChangeTitle = jest.fn();
  let updatePatrolMock;
  beforeEach(() => {
    updatePatrolMock = jest.fn(() => () => {});
    updatePatrol.mockImplementation(updatePatrolMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders correctly case of a new patrol', async () => {
    render(
      <Provider store={store}>
        <Header patrol={newPatrol} onChangeTitle={onChangeTitle} />
      </Provider>
    );

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toBeNull();
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toBeNull();
  });

  test('renders correctly case of a scheduled patrol', async () => {
    render(
      <Provider store={store}>
        <Header patrol={scheduledPatrol} onChangeTitle={onChangeTitle} />
      </Provider>
    );

    const buttons = await screen.findAllByRole('button');

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toHaveTextContent('Scheduled');
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toHaveTextContent('Scheduled');
    expect(buttons[0]).toHaveTextContent('Start Patrol');
    expect(buttons[1]).toHaveClass('kebabToggle');
  });

  test('renders correctly case of an active patrol', async () => {
    render(
      <Provider store={store}>
        <Header patrol={activePatrol} onChangeTitle={onChangeTitle} />
      </Provider>
    );

    const buttons = await screen.findAllByRole('button');

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toBeDefined();
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toHaveTextContent('Active');
    expect(buttons[0]).toHaveClass('kebabToggle');
  });

  test('renders correctly case of an overdue patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {}, tracks: [] }, view: {} })}>
        <Header patrol={overduePatrol} onChangeTitle={onChangeTitle} />
      </Provider>
    );

    const buttons = await screen.findAllByRole('button');

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toHaveTextContent('Scheduled');
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toHaveTextContent('Start Overdue');
    expect(buttons[0]).toHaveTextContent('Start Patrol');
    expect(buttons[1]).toHaveClass('kebabToggle');
  });

  test('renders correctly case of an done patrol', async () => {
    render(
      <Provider store={store}>
        <Header patrol={donePatrol} onChangeTitle={onChangeTitle} />
      </Provider>
    );

    const buttons = await screen.findAllByRole('button');

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toBeDefined();
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toHaveTextContent('Done');
    expect(buttons[0]).toHaveClass('kebabToggle');
  });

  test('renders correctly case of an cancelled patrol', async () => {
    render(
      <Provider store={store}>
        <Header patrol={cancelledPatrol} onChangeTitle={onChangeTitle} />
      </Provider>
    );

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toHaveTextContent('Scheduled');
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toHaveTextContent('Cancelled');
    expect((await screen.findByRole('button'))).toHaveTextContent('Restore');
  });

  test('triggers onChangeTitle callback when changing the title', async () => {
    render(
      <Provider store={store}>
        <Header patrol={newPatrol} onChangeTitle={onChangeTitle} />
      </Provider>
    );

    expect(onChangeTitle).toHaveBeenCalledTimes(0);

    const titleTextBox = await screen.findByRole('textbox');
    userEvent.type(titleTextBox, '2');

    expect(onChangeTitle).toHaveBeenCalledTimes(1);
    expect(onChangeTitle).toHaveBeenCalledWith('title2');
  });

  test('triggers startPatrol callback when clicking the start button', async () => {
    render(
      <Provider store={store}>
        <Header patrol={scheduledPatrol} onChangeTitle={onChangeTitle} />
      </Provider>
    );

    expect(updatePatrolMock).toHaveBeenCalledTimes(0);

    const buttons = await screen.findAllByRole('button');
    userEvent.click(buttons[0]);

    expect(updatePatrolMock).toHaveBeenCalledTimes(1);
    expect(updatePatrolMock.mock.calls[0][0].state).toBe('open');
  });

  test('triggers restorePatrol callback when clicking the restore button', async () => {
    render(
      <Provider store={store}>
        <Header patrol={cancelledPatrol} onChangeTitle={onChangeTitle} />
      </Provider>
    );

    expect(updatePatrolMock).toHaveBeenCalledTimes(0);

    const restorePatrolButton = await screen.findByRole('button');
    userEvent.click(restorePatrolButton);

    expect(updatePatrolMock).toHaveBeenCalledTimes(1);
    expect(updatePatrolMock.mock.calls[0][0].state).toBe('open');
  });
});
