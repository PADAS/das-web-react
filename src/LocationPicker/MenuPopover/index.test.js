import React from 'react';
import { Provider } from 'react-redux';
import { toast } from 'react-toastify';
import userEvent from '@testing-library/user-event';

import { act, render, screen, waitFor } from '../../test-utils';
import { createMapMock } from '../../__test-helpers/mocks';
import { GPS_FORMATS } from '../../utils/location';
import { MapContext } from '../../MapContext';
import { mockStore } from '../../__test-helpers/MockStore';
import { resetGeolocationPermissionProbe } from '../../utils/location/permission-probe';

import MenuPopover from '.';

jest.mock('react-toastify', () => ({
  ...jest.requireActual('react-toastify'),
  toast: { error: jest.fn() },
}));

jest.mock('mapbox-gl', () => ({
  ...jest.requireActual('mapbox-gl'),
  Popup: class {
    addTo() {}
    on() {}
    remove() {}
    setDOMContent() {}
    setOffset() {}
    trackPointer() {}
  },
}));

describe('LocationPicker - MenuPopover', () => {
  const onBlur = jest.fn();
  const onChange = jest.fn();
  const onClose = jest.fn();
  const setLocationButtonRefFocus = jest.fn();

  let map, originalGeolocation, store;
  beforeEach(() => {
    originalGeolocation = window.navigator.geolocation;

    resetGeolocationPermissionProbe();

    store = {
      view: {
        coordinateReferenceSystems: {
          selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
          storedSystems: [],
        },
        mapLocationSelection: {
          isPickingLocation: false,
        },
        showUserLocation: false,
        userLocation: null,
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };

    map = createMapMock();
  });

  const renderMenuPopover = (props, overrideStore, overrideMap = map) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <MapContext.Provider value={overrideMap}>
        <MenuPopover
          className="className"
          id="locationPicker"
          onBlur={onBlur}
          onChange={onChange}
          onClose={onClose}
          setLocationButtonRef={{
            current: {
              contains: () => false,
              focus: setLocationButtonRefFocus,
            },
          }}
          style={{}}
          target={{
            current: {
              contains: () => false,
              offsetWidth: 320,
            },
          }}
          value={null}
          {...props}
        />
      </MapContext.Provider>
    </Provider>
  );

  afterEach(() => {
    window.navigator.geolocation = originalGeolocation;

    jest.restoreAllMocks();
  });

  test('matches the width of the target while is less than 380 and more than 280', async () => {
    renderMenuPopover();

    const menuPopover = screen.getByRole('dialog', { name: 'Location' });

    expect(menuPopover).toHaveStyle('min-width: 320px;');
    expect(menuPopover).toHaveStyle('width: 320px;');
  });

  test('sets the popover width to 280 if the target is smaller', async () => {
    renderMenuPopover({
      target: {
        current: {
          contains: () => false,
          offsetWidth: 150,
        },
      },
    });

    const menuPopover = screen.getByRole('dialog', { name: 'Location' });

    expect(menuPopover).toHaveStyle('min-width: 280px;');
    expect(menuPopover).toHaveStyle('width: 280px;');
  });

  test('sets the popover width to 380 if the target is bigger', async () => {
    renderMenuPopover({
      target: {
        current: {
          contains: () => false,
          offsetWidth: 600,
        },
      },
    });

    const menuPopover = screen.getByRole('dialog', { name: 'Location' });

    expect(menuPopover).toHaveStyle('min-width: 380px;');
    expect(menuPopover).toHaveStyle('width: 380px;');
  });

  test('changes the location when the user types in the search input', async () => {
    renderMenuPopover();

    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search location in DEG format' }), '10,10');

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledWith({ latitude: 10, longitude: 10 });
  });

  test('closes the menu and focuses the set location button if the user presses enter while focusing the search input', async () => {
    renderMenuPopover();

    expect(onClose).not.toHaveBeenCalled();
    expect(setLocationButtonRefFocus).not.toHaveBeenCalled();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search location in DEG format' }), '10,10');
    await userEvent.keyboard('{Enter}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setLocationButtonRefFocus).toHaveBeenCalledTimes(1);
  });

  test('does neither close the menu nor focuses the set location button if the user presses enter while picking a location', async () => {
    store.view.mapLocationSelection.isPickingLocation = true;
    renderMenuPopover();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search location in DEG format' }), '10,10');
    await userEvent.keyboard('{Enter}');

    expect(onClose).not.toHaveBeenCalled();
    expect(setLocationButtonRefFocus).not.toHaveBeenCalled();
  });

  test('closes the menu and focuses the set location button if the user presses escape', async () => {
    renderMenuPopover();

    expect(onClose).not.toHaveBeenCalled();
    expect(setLocationButtonRefFocus).not.toHaveBeenCalled();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search location in DEG format' }), '10,10');
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setLocationButtonRefFocus).toHaveBeenCalledTimes(1);
  });

  test('does neither close the menu nor focuse the set location button if the user presses escape while picking a location', async () => {
    store.view.mapLocationSelection.isPickingLocation = true;
    renderMenuPopover();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search location in DEG format' }), '10,10');
    await userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
    expect(setLocationButtonRefFocus).not.toHaveBeenCalled();
  });

  test('changes the location when the user picks a location in the map', async () => {
    renderMenuPopover();

    await userEvent.click(screen.getByLabelText('Pick a location on the map'));

    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(setLocationButtonRefFocus).not.toHaveBeenCalled();

    map.__test__.fireHandlers('click', { lngLat: { lng: 10.012657, lat: 11.666666 } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ latitude: 11.666666, longitude: 10.012657 });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setLocationButtonRefFocus).toHaveBeenCalledTimes(1);
  });

  test('renders the pick map location button when a map is available', async () => {
    renderMenuPopover();

    expect(screen.getByLabelText('Pick a location on the map')).toBeVisible();
  });

  test('does not render the pick map location button when there is no map', async () => {
    renderMenuPopover({}, undefined, null);

    expect(screen.queryByLabelText('Pick a location on the map')).toBeNull();
  });

  test('does not show the get user location button if the user location is not active', async () => {
    renderMenuPopover();

    expect(screen.queryByLabelText('Get current position')).toBeNull();
  });

  test('shows the get user location button if the user location is active', async () => {
    store.view.showUserLocation = true;
    renderMenuPopover();

    expect(screen.getByLabelText('Get current position')).toBeVisible();
  });

  test('changes the location when the user clicks the button to get its location', async () => {
    store.view.showUserLocation = true;
    store.view.userLocation = { coords: { latitude: 10, longitude: 10 }, timestamp: Date.now() };
    renderMenuPopover();

    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(setLocationButtonRefFocus).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Get current position'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ latitude: 10, longitude: 10 });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setLocationButtonRefFocus).toHaveBeenCalledTimes(1);
  });

  test('closes the menu if the user clicks outside and triggers the blur callback if the click was outside of the picker', async () => {
    render(<>
      <div data-testid="outside" />

      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <MenuPopover
            className="className"
            id="locationPicker"
            onBlur={onBlur}
            onChange={onChange}
            onClose={onClose}
            setLocationButtonRef={{
              current: {
                contains: () => false,
                focus: setLocationButtonRefFocus,
              },
            }}
            style={{}}
            target={{
              current: {
                contains: () => false,
                offsetWidth: 100,
              },
            }}
            value={null}
          />
        </MapContext.Provider>
      </Provider>
    </>);

    expect(onClose).not.toHaveBeenCalled();
    expect(onBlur).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId('outside'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test('closes the menu if the user clicks outside but does not trigger the blur callback if the click was inside the picker', async () => {
    render(<>
      <div data-testid="outside" />

      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <MenuPopover
            className="className"
            id="locationPicker"
            onBlur={onBlur}
            onChange={onChange}
            onClose={onClose}
            setLocationButtonRef={{
              current: {
                contains: () => false,
                focus: setLocationButtonRefFocus,
              },
            }}
            style={{}}
            target={{
              current: {
                contains: () => true,
                offsetWidth: 100,
              },
            }}
            value={null}
          />
        </MapContext.Provider>
      </Provider>
    </>);

    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId('outside'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onBlur).not.toHaveBeenCalled();
  });

  test('wraps focus to the GPS input on shift+tab from the GPS format toggle when there is no map and no user location', async () => {
    renderMenuPopover({}, undefined, null);

    expect(screen.queryByLabelText('Pick a location on the map')).toBeNull();
    expect(screen.queryByLabelText('Get current position')).toBeNull();

    const gpsInput = screen.getByRole('searchbox', { name: 'Search location in DEG format' });
    const degToggle = screen.getByRole('radio', { name: 'DEG' });
    degToggle.focus();

    await userEvent.tab({ shift: true });

    expect(document.activeElement).toBe(gpsInput);
  });

  test('wraps focus to the pick map location button on shift+tab from the GPS format toggle when a map is available', async () => {
    renderMenuPopover();

    const pickMapLocationButton = await screen.findByLabelText('Pick a location on the map');

    const degToggle = screen.getByRole('radio', { name: 'DEG' });
    degToggle.focus();

    await userEvent.tab({ shift: true });

    expect(document.activeElement).toBe(pickMapLocationButton);
  });

  describe('the geolocation permission blocked message', () => {
    const permissionBlockedMessage = 'Location sharing blocked by browser';

    let permissionStatus;
    beforeEach(() => {
      permissionStatus = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        state: 'denied',
      };

      global.navigator.permissions = { query: jest.fn().mockResolvedValue(permissionStatus) };

      store.view.showUserLocation = true;
    });

    afterEach(() => {
      delete global.navigator.permissions;
    });

    test('shows the message if the permission is denied', async () => {
      renderMenuPopover();

      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(permissionBlockedMessage));

      expect(global.navigator.permissions.query).toHaveBeenCalledWith({ name: 'geolocation' });
    });

    test('keeps the live region mounted while the permission is not denied', async () => {
      permissionStatus.state = 'granted';
      renderMenuPopover();

      await waitFor(() => expect(permissionStatus.addEventListener).toHaveBeenCalled());

      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });

    test('does not show the message if the permission is granted', async () => {
      permissionStatus.state = 'granted';
      renderMenuPopover();

      await waitFor(() => expect(permissionStatus.addEventListener).toHaveBeenCalled());

      expect(screen.queryByText(permissionBlockedMessage)).toBeNull();
    });

    test('does not show the message if the permission has not been requested yet', async () => {
      permissionStatus.state = 'prompt';
      renderMenuPopover();

      await waitFor(() => expect(permissionStatus.addEventListener).toHaveBeenCalled());

      expect(screen.queryByText(permissionBlockedMessage)).toBeNull();
    });

    test('shows the message if the user denies the permission while the menu is open', async () => {
      permissionStatus.state = 'prompt';
      renderMenuPopover();

      await waitFor(() => expect(permissionStatus.addEventListener).toHaveBeenCalled());

      expect(screen.queryByText(permissionBlockedMessage)).toBeNull();

      const [, onPermissionStateChange] = permissionStatus.addEventListener.mock.calls[0];
      act(() => onPermissionStateChange({ target: { state: 'denied' } }));

      expect(screen.getByRole('status')).toHaveTextContent(permissionBlockedMessage);
    });

    test('shows the message if the user dismisses the browser prompt without the state changing', async () => {
      permissionStatus.state = 'prompt';
      window.navigator.geolocation = {
        getCurrentPosition: jest.fn((_, errorCallback) => errorCallback({ code: 1, PERMISSION_DENIED: 1 })),
      };
      renderMenuPopover();

      await waitFor(() => expect(permissionStatus.addEventListener).toHaveBeenCalled());

      const button = screen.getByLabelText('Get current position');

      expect(button).not.toHaveAttribute('aria-disabled');

      await userEvent.click(button);

      expect(screen.getByRole('status')).toHaveTextContent(permissionBlockedMessage);
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(toast.error).not.toHaveBeenCalled();
    });

    test('falls back to the probe if the query is rejected', async () => {
      global.navigator.permissions.query.mockRejectedValue(new TypeError('unknown permission name'));
      window.navigator.geolocation = {
        getCurrentPosition: jest.fn((_, errorCallback) => errorCallback({ code: 1, PERMISSION_DENIED: 1 })),
      };
      renderMenuPopover();

      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(permissionBlockedMessage));

      expect(screen.getByLabelText('Get current position')).toHaveAttribute('aria-disabled', 'true');
    });

    test('does not check the permission if the user location is not active', async () => {
      store.view.showUserLocation = false;
      renderMenuPopover();

      await waitFor(() => expect(screen.getByRole('dialog', { name: 'Location' })).toBeVisible());

      expect(global.navigator.permissions.query).not.toHaveBeenCalled();
      expect(screen.queryByRole('status')).toBeNull();
    });

    test('stops listening to permission changes on unmount', async () => {
      const { unmount } = renderMenuPopover();

      await waitFor(() => expect(permissionStatus.addEventListener).toHaveBeenCalled());

      unmount();

      expect(permissionStatus.removeEventListener).toHaveBeenCalledTimes(1);
    });

    test('ghosts the get user location button while the permission is denied', async () => {
      renderMenuPopover();

      const button = screen.getByLabelText('Get current position');

      await waitFor(() => expect(button).toHaveAttribute('aria-disabled', 'true'));

      expect(button).not.toBeDisabled();
    });

    test('describes the ghosted button with the blocked message', async () => {
      renderMenuPopover();

      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(permissionBlockedMessage));

      expect(screen.getByLabelText('Get current position'))
        .toHaveAttribute('aria-describedby', screen.getByRole('status').id);
    });

    test('does not ghost the get user location button while the permission is granted', async () => {
      permissionStatus.state = 'granted';
      renderMenuPopover();

      await waitFor(() => expect(permissionStatus.addEventListener).toHaveBeenCalled());

      expect(screen.getByLabelText('Get current position')).not.toHaveAttribute('aria-disabled');
    });

    test('keeps cycling focus through the ghosted button', async () => {
      renderMenuPopover();

      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(permissionBlockedMessage));

      const button = screen.getByLabelText('Get current position');
      const degToggle = screen.getByRole('radio', { name: 'DEG' });
      degToggle.focus();

      await userEvent.tab({ shift: true });

      expect(document.activeElement).toBe(button);

      await userEvent.tab();

      expect(document.activeElement).toBe(degToggle);
    });
  });

  describe('the geolocation permission blocked message without the permissions API', () => {
    const permissionBlockedMessage = 'Location sharing blocked by browser';

    beforeEach(() => {
      store.view.showUserLocation = true;
    });

    test('shows the message and ghosts the button if the probe reports a denial', async () => {
      window.navigator.geolocation = {
        getCurrentPosition: jest.fn((_, errorCallback) => errorCallback({ code: 1, PERMISSION_DENIED: 1 })),
      };
      renderMenuPopover();

      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(permissionBlockedMessage));

      expect(screen.getByLabelText('Get current position')).toHaveAttribute('aria-disabled', 'true');
    });

    test('neither shows the message nor ghosts the button if the probe succeeds', async () => {
      window.navigator.geolocation = {
        getCurrentPosition: jest.fn((successCallback) => successCallback({ coords: {} })),
      };
      renderMenuPopover();

      await waitFor(() => expect(window.navigator.geolocation.getCurrentPosition).toHaveBeenCalled());

      expect(screen.queryByText(permissionBlockedMessage)).toBeNull();
      expect(screen.getByLabelText('Get current position')).not.toHaveAttribute('aria-disabled');
    });

    test('shows the message and ghosts the button if the click is denied after an inconclusive probe', async () => {
      window.navigator.geolocation = {
        getCurrentPosition: jest.fn((_, errorCallback) => errorCallback({ code: 3, PERMISSION_DENIED: 1 })),
      };
      renderMenuPopover();

      await waitFor(() => expect(window.navigator.geolocation.getCurrentPosition).toHaveBeenCalled());

      const button = screen.getByLabelText('Get current position');

      expect(button).not.toHaveAttribute('aria-disabled');

      window.navigator.geolocation.getCurrentPosition = jest.fn(
        (_, errorCallback) => errorCallback({ code: 1, PERMISSION_DENIED: 1 })
      );

      await userEvent.click(button);

      expect(screen.getByRole('status')).toHaveTextContent(permissionBlockedMessage);
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(toast.error).not.toHaveBeenCalled();
    });

    test('reads the position only once across repeated openings while the permission is granted', async () => {
      window.navigator.geolocation = {
        getCurrentPosition: jest.fn((successCallback) => successCallback({ coords: {} })),
      };

      const { unmount } = renderMenuPopover();
      await waitFor(() => expect(window.navigator.geolocation.getCurrentPosition).toHaveBeenCalled());
      unmount();

      renderMenuPopover();
      await waitFor(() => expect(screen.getByRole('dialog', { name: 'Location' })).toBeVisible());

      expect(window.navigator.geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    });

    test('checks the permission again on reopening so unblocking it clears the message', async () => {
      window.navigator.geolocation = {
        getCurrentPosition: jest.fn((_, errorCallback) => errorCallback({ code: 1, PERMISSION_DENIED: 1 })),
      };

      const { unmount } = renderMenuPopover();
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(permissionBlockedMessage));
      unmount();

      window.navigator.geolocation.getCurrentPosition = jest.fn(
        (successCallback) => successCallback({ coords: {} })
      );

      renderMenuPopover();

      await waitFor(() => expect(window.navigator.geolocation.getCurrentPosition).toHaveBeenCalled());

      expect(screen.getByRole('status')).toBeEmptyDOMElement();
      expect(screen.getByLabelText('Get current position')).not.toHaveAttribute('aria-disabled');
    });

    test('does not probe if the user location is not active', async () => {
      store.view.showUserLocation = false;
      window.navigator.geolocation = { getCurrentPosition: jest.fn() };
      renderMenuPopover();

      await waitFor(() => expect(screen.getByRole('dialog', { name: 'Location' })).toBeVisible());

      expect(window.navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
      expect(screen.queryByRole('status')).toBeNull();
    });
  });

  test('does not close the menu if the user clicks outside while picking a location', async () => {
    store.view.mapLocationSelection.isPickingLocation = true;

    render(<>
      <div data-testid="outside" />

      <Provider store={mockStore(store)}>
        <MapContext.Provider value={map}>
          <MenuPopover
            className="className"
            id="locationPicker"
            onBlur={onBlur}
            onChange={onChange}
            onClose={onClose}
            setLocationButtonRef={{
              current: {
                contains: () => false,
                focus: setLocationButtonRefFocus,
              },
            }}
            style={{}}
            target={{
              current: {
                contains: () => false,
                offsetWidth: 100,
              },
            }}
            value={null}
          />
        </MapContext.Provider>
      </Provider>
    </>);

    await userEvent.click(screen.getByTestId('outside'));

    expect(onClose).not.toHaveBeenCalled();
    expect(onBlur).not.toHaveBeenCalled();
  });
});
