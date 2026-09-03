import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../../../../__test-helpers/MockStore';
import { PATROL_UI_STATES, PERMISSION_KEYS, PERMISSIONS } from '../../../../../constants';
import { render, screen } from '../../../../../test-utils';
import { TrackerContext } from '../../../../../utils/analytics';

import StatusSelect from './';

const { ACTIVE, DONE, INVALID, PAUSED } = PATROL_UI_STATES;

const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

// An active patrol can move to cancelled, paused or done, so it covers every menu behavior.
const activePatrol = {
  state: 'open',
  patrol_segments: [{ time_range: { start_time: TWO_HOURS_AGO, end_time: null } }],
};

const patrolWithoutLegs = { state: 'open', patrol_segments: [] };

const storeWithPermissions = (patrolsPermissions) => ({
  data: { user: { permissions: { [PERMISSION_KEYS.PATROLS]: patrolsPermissions } } },
  view: {},
});

describe('SideBar - PatrolsManager - PatrolOverview - Header - StatusSelect', () => {
  let onSelect;
  let track;

  beforeEach(() => {
    onSelect = jest.fn();
    track = jest.fn();
  });

  const renderStatusSelect = ({ store = storeWithPermissions([PERMISSIONS.UPDATE]), ...props } = {}) => render(
    <Provider store={mockStore(store)}>
      <TrackerContext.Provider value={{ track }}>
        <StatusSelect
          isDirty={false}
          onSelect={onSelect}
          patrol={activePatrol}
          patrolState={ACTIVE}
          state={ACTIVE}
          {...props}
        />
      </TrackerContext.Provider>
    </Provider>
  );

  const getToggle = () => screen.getByRole('button', { name: /Change patrol status/ });

  const openMenu = () => userEvent.click(getToggle());

  test('shows the patrol state as the toggle label', () => {
    renderStatusSelect();

    expect(getToggle()).toHaveTextContent('Active');
  });

  test('shows the toggle collapsed, with the menu closed, by default', () => {
    renderStatusSelect();

    expect(getToggle()).toHaveAttribute('aria-haspopup', 'menu');
    expect(getToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('shows the menu when the toggle is clicked', async () => {
    renderStatusSelect();

    await openMenu();

    expect(await screen.findByRole('menu', { name: 'Patrol status actions' })).toBeInTheDocument();
    expect(getToggle()).toHaveAttribute('aria-expanded', 'true');
  });

  test('lists the current status first, then the ones it can move to', async () => {
    renderStatusSelect();

    await openMenu();

    expect((await screen.findAllByRole('menuitemradio')).map((option) => option.textContent))
      .toEqual(['Active', 'Cancelled', 'Paused', 'Done']);
  });

  test('checks the current status when there is nothing picked yet', async () => {
    renderStatusSelect();

    await openMenu();

    expect(await screen.findByRole('menuitemradio', { name: 'Active' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Done' })).not.toBeChecked();
  });

  test('checks the picked status instead of the current one', async () => {
    renderStatusSelect({ isDirty: true, state: DONE });

    await openMenu();

    expect(await screen.findByRole('menuitemradio', { name: 'Done' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Active' })).not.toBeChecked();
  });

  test('focuses the checked status when the menu opens', async () => {
    renderStatusSelect({ isDirty: true, state: PAUSED });

    await openMenu();

    expect(await screen.findByRole('menuitemradio', { name: 'Paused' })).toHaveFocus();
  });

  test('opens the menu when ArrowDown is pressed on the toggle', async () => {
    renderStatusSelect();

    getToggle().focus();
    await userEvent.keyboard('{ArrowDown}');

    expect(await screen.findByRole('menuitemradio', { name: 'Active' })).toHaveFocus();
  });

  test('opens the menu when ArrowUp is pressed on the toggle', async () => {
    renderStatusSelect();

    getToggle().focus();
    await userEvent.keyboard('{ArrowUp}');

    expect(await screen.findByRole('menuitemradio', { name: 'Active' })).toHaveFocus();
  });

  test('leaves the menu closed when a key it does not handle is pressed on the toggle', async () => {
    renderStatusSelect();

    getToggle().focus();
    await userEvent.keyboard('a');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('moves focus to the next status when ArrowDown is pressed, wrapping around', async () => {
    renderStatusSelect();

    await openMenu();
    await screen.findByRole('menu');

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitemradio', { name: 'Cancelled' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('menuitemradio', { name: 'Done' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitemradio', { name: 'Active' })).toHaveFocus();
  });

  test('moves focus to the previous status when ArrowUp is pressed, wrapping around', async () => {
    renderStatusSelect();

    await openMenu();
    await screen.findByRole('menu');

    await userEvent.keyboard('{ArrowUp}');

    expect(screen.getByRole('menuitemradio', { name: 'Done' })).toHaveFocus();
  });

  test('moves focus to the last status when End is pressed, and the first when Home is pressed', async () => {
    renderStatusSelect();

    await openMenu();
    await screen.findByRole('menu');

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('menuitemradio', { name: 'Done' })).toHaveFocus();

    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('menuitemradio', { name: 'Active' })).toHaveFocus();
  });

  test('keeps the menu open when a key it does not handle is pressed inside it', async () => {
    renderStatusSelect();

    await openMenu();
    await screen.findByRole('menu');

    await userEvent.keyboard('a');

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Active' })).toHaveFocus();
  });

  test('hides the menu and refocuses the toggle when Escape is pressed', async () => {
    renderStatusSelect();

    await openMenu();
    await screen.findByRole('menu');

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(getToggle()).toHaveFocus();
  });

  test('hides the menu and carries focus on to the next element when Tab is pressed', async () => {
    render(
      <Provider store={mockStore(storeWithPermissions([PERMISSIONS.UPDATE]))}>
        <TrackerContext.Provider value={{ track }}>
          <StatusSelect isDirty={false} onSelect={onSelect} patrol={activePatrol} patrolState={ACTIVE} state={ACTIVE} />
        </TrackerContext.Provider>

        <button type="button">Next</button>
      </Provider>
    );

    await openMenu();
    await screen.findByRole('menu');

    await userEvent.keyboard('{Tab}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  test('hides the menu when clicking outside of it', async () => {
    renderStatusSelect();

    await openMenu();
    await screen.findByRole('menu');

    await userEvent.click(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('hides the menu when the toggle is clicked again', async () => {
    renderStatusSelect();

    await openMenu();
    await screen.findByRole('menu');

    await openMenu();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('reports the picked status and closes the menu', async () => {
    renderStatusSelect();

    await openMenu();
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Done' }));

    expect(onSelect).toHaveBeenCalledWith(DONE);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('reports the current status when it is picked back', async () => {
    renderStatusSelect({ isDirty: true, state: DONE });

    await openMenu();
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Active' }));

    expect(onSelect).toHaveBeenCalledWith(ACTIVE);
  });

  test('tracks the picked status', async () => {
    renderStatusSelect();

    await openMenu();
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Done' }));

    expect(track).toHaveBeenCalledWith('Pick the "done" patrol status from patrol overview');
  });

  test('italicizes the status while it is unsaved', () => {
    renderStatusSelect({ isDirty: true, state: DONE });

    expect(screen.getByText('Done')).toHaveClass('unsavedLabel');
  });

  test('does not italicize the status the patrol is saved with', () => {
    renderStatusSelect();

    expect(screen.getByRole('button', { name: 'Active, Change patrol status' })).toBeInTheDocument();
    expect(screen.getByText('Active')).not.toHaveClass('unsavedLabel');
  });

  test('shows a plain pill with no menu when the patrol has no status to move to', () => {
    renderStatusSelect({ patrol: patrolWithoutLegs, patrolState: INVALID, state: INVALID });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Invalid Configuration')).toBeInTheDocument();
  });

  test('shows a plain pill with no menu to a user without patrol update permission', () => {
    renderStatusSelect({ store: storeWithPermissions([PERMISSIONS.READ]) });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
