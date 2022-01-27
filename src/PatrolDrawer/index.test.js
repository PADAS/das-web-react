import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { hideDrawer } from '../ducks/drawer';
import { mockStore } from '../__test-helpers/MockStore';
import { newPatrol } from '../__test-helpers/fixtures/patrols';
import PatrolDrawer from './';

jest.mock('../ducks/drawer', () => ({
  ...jest.requireActual('../ducks/drawer'),
  hideDrawer: jest.fn(),
}));

describe('PatrolDrawer', () => {
  let hideDrawerMock;
  beforeEach(() => {
    hideDrawerMock = jest.fn(() => () => {});
    hideDrawer.mockImplementation(hideDrawerMock);
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <PatrolDrawer newPatrol={newPatrol} />
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
    const titleInput = await screen.findByRole('textbox');

    // Couldn't mock the patrol types to get the expected display title
    expect(titleInput).toHaveAttribute('value', 'Unknown patrol type');

    userEvent.type(titleInput, '2');

    expect(titleInput).toHaveAttribute('value', 'Unknown patrol type2');
  });

  test('closes the drawer when clicking the exit button', async () => {
    expect(hideDrawer).toHaveBeenCalledTimes(0);

    const exitButton = await screen.findByText('Exit');
    userEvent.click(exitButton);

    expect(hideDrawer).toHaveBeenCalledTimes(1);
  });
});
