import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../__test-helpers/MockStore';
import { render, screen, within } from '../../test-utils';

import NavHomeMenu from './';

describe('Nav - NavHomeMenu', () => {
  const maps = [
    { center: [0, 0], icon: { src: 'earth.png' }, id: 'earth', title: 'Earth', zoom: 3 },
    { center: [1, 1], id: 'park', title: 'National Park', zoom: 9 },
  ];

  let onCurrentLocationClick;
  let onMapSelect;
  let store;

  beforeEach(() => {
    onCurrentLocationClick = jest.fn();
    onMapSelect = jest.fn();

    store = { view: { showUserLocation: false, userLocation: null } };
  });

  const renderNavHomeMenu = (props = {}) => render(<Provider store={mockStore(store)}>
    <NavHomeMenu
      maps={maps}
      onCurrentLocationClick={onCurrentLocationClick}
      onMapSelect={onMapSelect}
      selectedMap={maps[0]}
      {...props}
    />
  </Provider>);

  const getToggle = () => screen.getByRole('button', { name: /^Map quick links:/ });

  const openMenu = async () => {
    await userEvent.click(getToggle());

    return screen.findByRole('menu', { name: 'Map quick links' });
  };

  test('names the toggle after the selected map once, despite its icon', () => {
    renderNavHomeMenu();

    expect(getToggle()).toHaveAccessibleName('Map quick links: Earth');
    expect(getToggle()).toHaveAttribute('title', 'Map quick links');
  });

  test('shows the toggle collapsed, with the menu closed, by default', () => {
    renderNavHomeMenu();

    expect(getToggle()).toHaveAttribute('aria-haspopup', 'menu');
    expect(getToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('lists every map, checking only the selected one', async () => {
    renderNavHomeMenu();

    const menu = await openMenu();
    const mapOptions = within(menu).getAllByRole('menuitemradio');

    expect(mapOptions.map((mapOption) => mapOption.textContent)).toEqual(['Earth', 'National Park']);
    expect(mapOptions[0]).toHaveAttribute('aria-checked', 'true');
    expect(mapOptions[1]).toHaveAttribute('aria-checked', 'false');
  });

  test('selects a map and returns focus to the toggle when the user picks it', async () => {
    renderNavHomeMenu();

    await openMenu();
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'National Park' }));

    expect(onMapSelect).toHaveBeenCalledWith(maps[1]);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(getToggle()).toHaveFocus();
  });

  test('moves through the maps with the arrow keys', async () => {
    renderNavHomeMenu();

    getToggle().focus();

    await userEvent.keyboard('{ArrowDown}');

    expect(await screen.findByRole('menuitemradio', { name: 'Earth' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitemradio', { name: 'National Park' })).toHaveFocus();
  });

  test('does not offer the current location while it cannot be shown', async () => {
    renderNavHomeMenu();

    await openMenu();

    expect(screen.queryByRole('menuitem', { name: 'My Current Location' })).not.toBeInTheDocument();
  });

  test('jumps to the current location when the user picks it', async () => {
    const userLocation = { coords: { latitude: 2, longitude: 3 } };
    store.view = { showUserLocation: true, userLocation };

    renderNavHomeMenu();

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'My Current Location' }));

    expect(onCurrentLocationClick).toHaveBeenCalledWith(userLocation);
  });
});
