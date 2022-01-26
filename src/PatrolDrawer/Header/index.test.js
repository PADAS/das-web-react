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
  cancelledPatrol
} from '../../__test-helpers/fixtures/patrols';

describe('Header', () => {
  const onPatrolChange= jest.fn(), restorePatrol = jest.fn(), setTitle = jest.fn(), startPatrol = jest.fn();
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders correctly case of a new patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Header
          onPatrolChange={onPatrolChange}
          patrol={newPatrol}
          restorePatrol={restorePatrol}
          setTitle={setTitle}
          startPatrol={startPatrol}
          title="title"
        />
      </Provider>
    );

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toBeNull();
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toBeNull();
    expect((await screen.findByRole('button'))).toHaveTextContent('Start Patrol');
    expect((await screen.findByRole('button'))).toHaveClass('newPatrol');
  });

  test('renders correctly case of a scheduled patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Header
          onPatrolChange={onPatrolChange}
          patrol={scheduledPatrol}
          restorePatrol={restorePatrol}
          setTitle={setTitle}
          startPatrol={startPatrol}
          title="title"
        />
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
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Header
          onPatrolChange={onPatrolChange}
          patrol={activePatrol}
          restorePatrol={restorePatrol}
          setTitle={setTitle}
          startPatrol={startPatrol}
          title="title"
        />
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
        <Header
          onPatrolChange={onPatrolChange}
          patrol={overduePatrol}
          restorePatrol={restorePatrol}
          setTitle={setTitle}
          startPatrol={startPatrol}
          title="title"
        />
      </Provider>
    );

    const buttons = await screen.findAllByRole('button');

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toHaveTextContent('Scheduled 25 Nov \'21 13:28');
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toHaveTextContent('Start Overdue');
    expect(buttons[0]).toHaveTextContent('Start Patrol');
    expect(buttons[1]).toHaveClass('kebabToggle');
  });

  test('renders correctly case of an done patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Header
          onPatrolChange={onPatrolChange}
          patrol={donePatrol}
          restorePatrol={restorePatrol}
          setTitle={setTitle}
          startPatrol={startPatrol}
          title="title"
        />
      </Provider>
    );

    const buttons = await screen.findAllByRole('button');

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toBeDefined();
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toHaveTextContent('Done');
    expect(buttons[0]).toHaveClass('kebabToggle');
  });

  test('renders correctly case of an cancelled patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Header
          onPatrolChange={onPatrolChange}
          patrol={cancelledPatrol}
          restorePatrol={restorePatrol}
          setTitle={setTitle}
          startPatrol={startPatrol}
          title="title"
        />
      </Provider>
    );

    expect((screen.queryByTestId('patrol-drawer-header-details'))).toHaveTextContent('Scheduled 18 Jan 15:42');
    expect((screen.queryByTestId('patrol-drawer-header-description'))).toHaveTextContent('Cancelled');
    expect((await screen.findByRole('button'))).toHaveTextContent('Restore');
  });

  test('triggers setTitle callback when changing the title', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Header
          onPatrolChange={onPatrolChange}
          patrol={newPatrol}
          restorePatrol={restorePatrol}
          setTitle={setTitle}
          startPatrol={startPatrol}
          title="title"
        />
      </Provider>
    );

    expect(setTitle).toHaveBeenCalledTimes(0);

    const titleTextBox = await screen.findByRole('textbox');
    userEvent.type(titleTextBox, '2');

    expect(setTitle).toHaveBeenCalledTimes(1);
    expect(setTitle).toHaveBeenCalledWith('title2');
  });

  test('triggers startPatrol callback when clicking the start button', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Header
          onPatrolChange={onPatrolChange}
          patrol={newPatrol}
          restorePatrol={restorePatrol}
          setTitle={setTitle}
          startPatrol={startPatrol}
          title="title"
        />
      </Provider>
    );

    expect(startPatrol).toHaveBeenCalledTimes(0);

    const startPatrolButton = await screen.findByRole('button');
    userEvent.click(startPatrolButton);

    expect(startPatrol).toHaveBeenCalledTimes(1);
  });

  test('triggers restorePatrol callback when clicking the restore button', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Header
          onPatrolChange={onPatrolChange}
          patrol={cancelledPatrol}
          restorePatrol={restorePatrol}
          setTitle={setTitle}
          startPatrol={startPatrol}
          title="title"
        />
      </Provider>
    );

    expect(restorePatrol).toHaveBeenCalledTimes(0);

    const restorePatrolButton = await screen.findByRole('button');
    userEvent.click(restorePatrolButton);

    expect(restorePatrol).toHaveBeenCalledTimes(1);
  });
});
