import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { hideDrawer } from '../ducks/drawer';
import { mockStore } from '../__test-helpers/MockStore';
import { render, screen } from '../test-utils';

import Drawer from './';

jest.mock('../ducks/drawer', () => ({
  ...jest.requireActual('../ducks/drawer'),
  hideDrawer: jest.fn(),
}));

describe('Drawer', () => {
  let store;

  beforeEach(() => {
    hideDrawer.mockImplementation(() => () => {});

    store = {
      view: {
        drawer: {
          data: null,
          direction: 'right',
          drawerId: null,
          isOpen: false,
        },
      },
    };
  });

  const renderDrawer = () => render(<Provider store={mockStore(store)}>
    <Drawer />
  </Provider>);

  test('does not show the overlay or the drawer while it is closed', () => {
    renderDrawer();

    expect(screen.getByTestId('overlay')).not.toHaveClass('open');
    expect(screen.getByTestId('drawerContainer')).not.toHaveClass('open');
  });

  test('shows the overlay and the drawer while it is open', () => {
    store.view.drawer.isOpen = true;

    renderDrawer();

    expect(screen.getByTestId('overlay')).toHaveClass('open');
    expect(screen.getByTestId('drawerContainer')).toHaveClass('open');
  });

  test('keeps the closed drawer away from the keyboard and assistive technology', () => {
    renderDrawer();

    expect(screen.getByTestId('drawerContainer')).toHaveAttribute('inert');
  });

  test('lets the keyboard and assistive technology reach the open drawer', () => {
    store.view.drawer.isOpen = true;

    renderDrawer();

    expect(screen.getByTestId('drawerContainer')).not.toHaveAttribute('inert');
  });

  test('slides the drawer in from its direction', () => {
    store.view.drawer.isOpen = true;

    renderDrawer();

    expect(screen.getByTestId('drawerContainer')).toHaveClass('direction-right');
  });

  test('hides the drawer when the user clicks the overlay', async () => {
    store.view.drawer.isOpen = true;

    renderDrawer();

    expect(hideDrawer).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId('overlay'));

    expect(hideDrawer).toHaveBeenCalledTimes(1);
  });

  test('hides the drawer when the user presses escape', async () => {
    store.view.drawer.isOpen = true;

    renderDrawer();

    expect(hideDrawer).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');

    expect(hideDrawer).toHaveBeenCalledTimes(1);
  });
});
