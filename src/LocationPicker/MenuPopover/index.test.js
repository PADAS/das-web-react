import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../test-utils';
import { createMapMock } from '../../__test-helpers/mocks';
import { GPS_FORMATS } from '../../utils/location';
import { MapContext } from '../../App';
import { mockStore } from '../../__test-helpers/MockStore';

import MenuPopover from '.';

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

  let map, store;
  beforeEach(() => {
    store = {
      view: {
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
              offsetWidth: 100,
            },
          }}
          value={null}
          {...props}
        />
      </MapContext.Provider>
    </Provider>
  );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('matches the width of the target while is less than 380', () => {
    renderMenuPopover();

    const menuPopover = screen.getByRole('presentation');

    expect(menuPopover).toHaveStyle('min-width: 100px;');
    expect(menuPopover).toHaveStyle('width: 100px;');
  });

  test('changes the location when the user types in the GPS input', () => {
    renderMenuPopover();

    expect(onChange).not.toHaveBeenCalled();

    userEvent.type(screen.getByLabelText('GPS location'), '10,10');

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledWith({ latitude: 10, longitude: 10 });
  });

  test('closes the menu and focuses the set location button if the user presses enter while focusing the GPS input', () => {
    renderMenuPopover();

    expect(onClose).not.toHaveBeenCalled();
    expect(setLocationButtonRefFocus).not.toHaveBeenCalled();

    userEvent.type(screen.getByLabelText('GPS location'), '10,10');
    userEvent.keyboard('{Enter}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setLocationButtonRefFocus).toHaveBeenCalledTimes(1);
  });

  test('does neither close the menu nor focuse the set location button if the user presses enter while picking a location', () => {
    store.view.mapLocationSelection.isPickingLocation = true;
    renderMenuPopover();

    userEvent.type(screen.getByLabelText('GPS location'), '10,10');
    userEvent.keyboard('{Enter}');

    expect(onClose).not.toHaveBeenCalled();
    expect(setLocationButtonRefFocus).not.toHaveBeenCalled();
  });

  test('closes the menu and focuses the set location button if the user presses escape', () => {
    renderMenuPopover();

    expect(onClose).not.toHaveBeenCalled();
    expect(setLocationButtonRefFocus).not.toHaveBeenCalled();

    userEvent.type(screen.getByLabelText('GPS location'), '10,10');
    userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setLocationButtonRefFocus).toHaveBeenCalledTimes(1);
  });

  test('does neither close the menu nor focuse the set location button if the user presses escape while picking a location', () => {
    store.view.mapLocationSelection.isPickingLocation = true;
    renderMenuPopover();

    userEvent.type(screen.getByLabelText('GPS location'), '10,10');
    userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
    expect(setLocationButtonRefFocus).not.toHaveBeenCalled();
  });

  test('changes the location when the user picks a location in the map', () => {
    renderMenuPopover();

    userEvent.click(screen.getByLabelText('Pick a location on the map'));

    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(setLocationButtonRefFocus).not.toHaveBeenCalled();

    map.__test__.fireHandlers('click', { lngLat: { lng: 10.012657, lat: 11.666666 } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ latitude: 11.666666, longitude: 10.012657 });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setLocationButtonRefFocus).toHaveBeenCalledTimes(1);
  });

  test('does not show the get user location button if the user location is not active', () => {
    renderMenuPopover();

    expect(screen.queryByLabelText('Get current position')).toBeNull();
  });

  test('shows the get user location button if the user location is active', () => {
    store.view.showUserLocation = true;
    renderMenuPopover();

    expect(screen.getByLabelText('Get current position')).toBeVisible();
  });

  test('changes the location when the user clicks the button to get its location', () => {
    store.view.showUserLocation = true;
    store.view.userLocation = { coords: { latitude: 10, longitude: 10 } };
    renderMenuPopover();

    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(setLocationButtonRefFocus).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Get current position'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ latitude: 10, longitude: 10 });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setLocationButtonRefFocus).toHaveBeenCalledTimes(1);
  });

  test('closes the menu if the user clicks outside and triggers the blur callback if the click was outside of the picker', () => {
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

    userEvent.click(screen.getByTestId('outside'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  test('closes the menu if the user clicks outside but does not trigger the blur callback if the click was inside the picker', () => {
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

    userEvent.click(screen.getByTestId('outside'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onBlur).not.toHaveBeenCalled();
  });

  test('does not close the menu if the user clicks outside while picking a location', () => {
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

    userEvent.click(screen.getByTestId('outside'));

    expect(onClose).not.toHaveBeenCalled();
    expect(onBlur).not.toHaveBeenCalled();
  });
});
