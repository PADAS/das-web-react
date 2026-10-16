import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../../../../../test-utils';

import StatusSelect from './';

describe('SideBar - EventsManager - EventOverview - Header - StatusSelect', () => {
  let onSelect;

  beforeEach(() => {
    onSelect = jest.fn();
  });

  const renderStatusSelect = (props = {}) => render(<>
    <button type="button">Outside</button>

    <StatusSelect isDirty={false} onSelect={onSelect} savedState="active" state="active" {...props} />
  </>);

  const getToggle = () => screen.getByRole('button', { name: /Change event state/ });

  test('names the state of the event and marks it unsaved while dirty', () => {
    renderStatusSelect({ isDirty: true, state: 'resolved' });

    expect(getToggle()).toHaveAccessibleName('Resolved, Change event state');
    expect(within(getToggle()).getByText('Resolved')).toHaveClass('unsavedLabel');
  });

  test('offers every move away from the saved state', async () => {
    renderStatusSelect();

    await userEvent.click(getToggle());

    expect(screen.getAllByRole('menuitem').map((option) => option.textContent))
      .toEqual(['Active', 'Send to review', 'Resolve']);
  });

  test('selects the state the user picks and returns focus to the toggle', async () => {
    renderStatusSelect();

    await userEvent.click(getToggle());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Resolve' }));

    expect(onSelect).toHaveBeenCalledWith('resolved');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(getToggle()).toHaveFocus();
  });

  test('opens the menu on the current state with the up arrow', async () => {
    renderStatusSelect({ state: 'resolved' });

    getToggle().focus();
    await userEvent.keyboard('{ArrowUp}');

    expect(screen.getByRole('menuitem', { name: 'Resolve' })).toHaveFocus();
  });

  test('moves into a menu opened with the mouse with the arrow keys', async () => {
    renderStatusSelect();

    await userEvent.click(getToggle());
    getToggle().focus();
    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: 'Active' })).toHaveFocus();
  });

  test('moves through the options with the home and end keys', async () => {
    renderStatusSelect();

    getToggle().focus();
    await userEvent.keyboard('{ArrowDown}{End}');

    expect(screen.getByRole('menuitem', { name: 'Resolve' })).toHaveFocus();

    await userEvent.keyboard('{Home}');

    expect(screen.getByRole('menuitem', { name: 'Active' })).toHaveFocus();
  });

  test('closes the menu and returns focus to the toggle on tab', async () => {
    renderStatusSelect();

    getToggle().focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.tab();

    expect(screen.queryByRole('menu')).toBeNull();
  });

  test('closes the menu without taking focus back when the user clicks outside it', async () => {
    renderStatusSelect();

    await userEvent.click(getToggle());
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));

    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
  });
});
