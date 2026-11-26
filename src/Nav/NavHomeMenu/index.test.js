import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../__test-helpers/MockStore';
import { render, screen, within } from '../../test-utils';

import NavHomeMenu from './';

const mockTrack = jest.fn();
jest.mock('../../utils/analytics', () => ({
  ...jest.requireActual('../../utils/analytics'),
  trackEventFactory: () => ({ track: (...args) => mockTrack(...args) }),
}));

describe('Nav - NavHomeMenu', () => {
  const maps = [
    { center: [0, 0], icon: { src: 'earth.png' }, id: 'earth', name: 'earth', title: 'Earth', zoom: 3 },
    { center: [1, 1], id: 'park', name: 'park', title: 'National Park', zoom: 9 },
  ];

  let onCurrentLocationClick;
  let onMapSelect;
  let onSelectedMapClick;
  let store;

  beforeEach(() => {
    mockTrack.mockClear();
    onCurrentLocationClick = jest.fn();
    onMapSelect = jest.fn();
    onSelectedMapClick = jest.fn();

    store = { view: { showUserLocation: false, userLocation: null } };
  });

  const renderNavHomeMenu = (props = {}) => render(<Provider store={mockStore(store)}>
    <NavHomeMenu
      maps={maps}
      onCurrentLocationClick={onCurrentLocationClick}
      onMapSelect={onMapSelect}
      onSelectedMapClick={onSelectedMapClick}
      selectedMap={maps[0]}
      {...props}
    />
  </Provider>);

  const getJumpButton = () => screen.getByRole('button', { name: /^Jump to/ });

  const getToggle = () => screen.getByRole('button', { name: 'Choose a map quick link' });

  const openMenu = async () => {
    await userEvent.click(getToggle());

    return screen.findByRole('menu', { name: 'Map quick links' });
  };

  test('groups the jump button and the menu toggle under the quick links name', () => {
    renderNavHomeMenu();

    const group = screen.getByRole('group', { name: 'Map quick links' });

    expect(within(group).getAllByRole('button')).toEqual([getJumpButton(), getToggle()]);
  });

  test('names the jump button after the selected link and shows its icon and title', () => {
    renderNavHomeMenu();

    expect(getJumpButton()).toHaveAccessibleName('Jump to Earth');
    expect(getJumpButton()).toHaveAttribute('title', 'Jump to Earth');
    expect(getJumpButton()).toHaveTextContent('Earth');
    expect(within(getJumpButton()).getByRole('presentation')).toHaveAttribute('src', expect.stringContaining('earth.png'));
  });

  test('falls back to the link name in the jump button and its option when the link has no title', async () => {
    const untitledMap = { center: [2, 2], id: 'reserve', name: 'Game Reserve', zoom: 8 };

    renderNavHomeMenu({ maps: [...maps, untitledMap], selectedMap: untitledMap });

    expect(getJumpButton()).toHaveAccessibleName('Jump to Game Reserve');
    expect(getJumpButton()).toHaveTextContent('Game Reserve');

    await openMenu();

    expect(screen.getByRole('menuitemradio', { name: 'Game Reserve' })).toHaveAttribute('aria-checked', 'true');
  });

  test('jumps to the selected link with one click, without opening the menu', async () => {
    renderNavHomeMenu();

    await userEvent.click(getJumpButton());

    expect(onSelectedMapClick).toHaveBeenCalledWith(maps[0]);
    expect(onMapSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('jumps to the selected link from the keyboard', async () => {
    renderNavHomeMenu();

    getJumpButton().focus();

    await userEvent.keyboard('{Enter}');

    expect(onSelectedMapClick).toHaveBeenCalledWith(maps[0]);
  });

  test('shows the menu toggle collapsed, with the menu closed, by default', () => {
    renderNavHomeMenu();

    expect(getToggle()).toHaveAttribute('aria-haspopup', 'menu');
    expect(getToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(getToggle()).toHaveAttribute('title', 'Choose a map quick link');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('lists every link, checking only the selected one', async () => {
    renderNavHomeMenu();

    const menu = await openMenu();
    const mapOptions = within(menu).getAllByRole('menuitemradio');

    expect(getToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(mapOptions.map((mapOption) => mapOption.textContent)).toEqual(['Earth', 'National Park']);
    expect(mapOptions[0]).toHaveAttribute('aria-checked', 'true');
    expect(mapOptions[1]).toHaveAttribute('aria-checked', 'false');
  });

  test('shows the icon of a link before its name in its option, without adding it to the name', async () => {
    renderNavHomeMenu();

    await openMenu();

    const earthOption = screen.getByRole('menuitemradio', { name: 'Earth' });

    expect(within(earthOption).getByRole('presentation', { hidden: true }))
      .toHaveAttribute('src', expect.stringContaining('earth.png'));
    expect(earthOption).toHaveTextContent(/^Earth$/);
  });

  test('does not show an icon in the option of a link without one', async () => {
    renderNavHomeMenu();

    await openMenu();

    expect(within(screen.getByRole('menuitemradio', { name: 'National Park' }))
      .queryByRole('presentation', { hidden: true })).not.toBeInTheDocument();
  });

  test('selects a link and returns focus to the menu toggle when the user picks it', async () => {
    renderNavHomeMenu();

    await openMenu();
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'National Park' }));

    expect(onMapSelect).toHaveBeenCalledWith(maps[1]);
    expect(onSelectedMapClick).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(getToggle()).toHaveFocus();
  });

  test('moves through the links with the arrow keys', async () => {
    renderNavHomeMenu();

    getToggle().focus();

    await userEvent.keyboard('{ArrowDown}');

    expect(await screen.findByRole('menuitemradio', { name: 'Earth' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitemradio', { name: 'National Park' })).toHaveFocus();
  });

  test('closes the menu and returns focus to the menu toggle when the user presses Escape', async () => {
    renderNavHomeMenu();

    getToggle().focus();

    await userEvent.keyboard('{ArrowDown}');
    await screen.findByRole('menu');
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(getToggle()).toHaveFocus();
  });

  test('tracks opening and closing the menu', async () => {
    renderNavHomeMenu();

    await openMenu();
    await userEvent.click(getToggle());

    expect(mockTrack.mock.calls).toEqual([['Open Home Area Menu'], ['Close Home Area Menu']]);
  });

  test('does not show the menu toggle when the menu would hold only the selected link', () => {
    renderNavHomeMenu({ maps: [maps[0]] });

    expect(getJumpButton()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Choose a map quick link' })).not.toBeInTheDocument();
  });

  test('shows the menu toggle for a single link while the current location can be shown', async () => {
    store.view = { showUserLocation: true, userLocation: { coords: { latitude: 2, longitude: 3 } } };

    renderNavHomeMenu({ maps: [maps[0]] });

    await openMenu();

    expect(screen.getByRole('menuitem', { name: 'My Current Location' })).toBeInTheDocument();
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
    expect(onMapSelect).not.toHaveBeenCalled();
  });
});
