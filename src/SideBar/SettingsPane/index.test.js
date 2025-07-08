import React from 'react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { render, screen } from '../../test-utils';
import { createMapMock } from '../../__test-helpers/mocks';
import { MapContext } from '../../App';
import { mockStore } from '../../__test-helpers/MockStore';

import SettingsPane from './';

describe('SideBar - SettingsPane', () => {
  let initialState, renderWithWrapper, Wrapper, store, map;
  beforeEach(() => {
    map = createMapMock();
    jest.spyOn(global.localStorage.__proto__, 'getItem');
    jest.spyOn(global.localStorage.__proto__, 'setItem');
    global.localStorage.clear();

    initialState = {
      data: {
        eventFilter: {},
        patrolFilter: {},
      },
      view: {
        featureFlagOverrides: {},
        mapClusterConfig: {
          data: { events: true, subjects: true  },
        },
        mapPosition: {
          center: { lat: 0, lng: 0 },
          zoom: 10,
        },
        showMapNames: {},
        showUserLocation: true,
        simplifyMapDataOnZoom: false,
        systemConfig: { alerts_enabled: true },
        timeSliderState: { active: false },
        userLocation: {
          lat: 10,
          lng: 10,
        },
        userPreferences: { enable3D: true },
      }
    };

    store = mockStore(initialState);

    Wrapper = ({ children }) => /* eslint-disable-line react/display-name */
      <Provider store={store}>
        <MapContext.Provider value={map}>
          {children}
        </MapContext.Provider>
      </Provider>;

    renderWithWrapper = (Component) => render(Component, { wrapper: Wrapper });

    renderWithWrapper(
      <SettingsPane />
    );


  });

  afterEach(() => {
    global.localStorage.__proto__.getItem.mockRestore();
    global.localStorage.__proto__.setItem.mockRestore();
  });

  test('setting persistance options to "false" if initializing for the first time', () => {
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'er-web-restorable:eventFilter',
      JSON.stringify({ restore: false })
    );
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'er-web-restorable:eventFilter',
      JSON.stringify({ restore: false })
    );
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'er-web-restorable:eventFilter',
      JSON.stringify({ restore: false })
    );
  });

  describe('the "General" settings tab', () => {
    describe('persistence controls', () => {
      beforeEach(() => {
        /* clear the mocks as useLocalStorage calls these once when initializing */
        global.localStorage.__proto__.getItem.mockClear();
        global.localStorage.__proto__.setItem.mockClear();
      });
      test('toggling the event filter persistence setting when clicked', async () => {
        const eventFilterPersistToggle = await screen.findByText('Event Filters');
        await userEvent.click(eventFilterPersistToggle);

        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          'er-web-restorable:eventFilter',
          JSON.stringify({ restore: true })
        );
      });

      test('toggling the patrol filter persistence setting when clicked', async () => {
        const patrolFilterPersistToggle = await screen.findByText('Patrol Filters');
        await userEvent.click(patrolFilterPersistToggle);

        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          'er-web-restorable:patrolFilter',
          JSON.stringify({ restore: true })
        );
      });

      test('toggling the map position persistence setting when clicked', async () => {
        expect(global.localStorage.setItem).not.toHaveBeenCalled();

        const mapPositionPersistToggle = await screen.findByText('Map Position & Zoom Level');
        await userEvent.click(mapPositionPersistToggle);

        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          'er-web-restorable:mapPosition',
          JSON.stringify({ restore: true })
        );
      });
    });
  });

  describe('the alerts tab', () => {
    test('showing the alerts iframe', async () => {
      const alertsIframe = await screen.findByTestId('settings-alertsIframe');

      expect(alertsIframe).toBeInTheDocument();
    });
  });
});


