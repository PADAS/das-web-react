import React from 'react';
import { MapContext } from '../../App';
import { createMapMock } from '../../__test-helpers/mocks';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import SettingsPane from './';

import { mockStore } from '../../__test-helpers/MockStore';
import { render, screen } from '../../test-utils';

describe('SettingsPane', () => {
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
        mapPosition: {
          zoom: 10,
          center: { lat: 0, lng: 0 },
        },
        systemConfig: {
          alerts_enabled: true,
        },
        simplifyMapDataOnZoom: false,
        userLocation: {
          lat: 10,
          lng: 10,
        },
        featureFlagOverrides: {},
        timeSliderState: { active: false },
        mapClusterConfig: { reports: true, subjects: true },
        showMapNames: {},
        showUserLocation: true,
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
        userEvent.click(eventFilterPersistToggle);

        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          'er-web-restorable:eventFilter',
          JSON.stringify({ restore: true })
        );
      });

      test('toggling the patrol filter persistence setting when clicked', async () => {
        const patrolFilterPersistToggle = await screen.findByText('Patrol Filters');
        userEvent.click(patrolFilterPersistToggle);

        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          'er-web-restorable:patrolFilter',
          JSON.stringify({ restore: true })
        );
      });

      test('toggling the map position persistence setting when clicked', async () => {
        expect(global.localStorage.setItem).not.toHaveBeenCalled();

        const mapPositionPersistToggle = await screen.findByText('Map Position & Zoom Level');
        userEvent.click(mapPositionPersistToggle);

        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          'er-web-restorable:mapPosition',
          JSON.stringify({ restore: true })
        );
      });
    });
  });

  describe('the "Map" settings tab', () => {
    it('toggles the showInactiveRadios state when the checkbox is clicked', async () => {
      const checkbox = await screen.findByText('Show Inactive Radios');
      userEvent.click(checkbox);

      const actions = store.getActions();
      expect(actions).toEqual([{ type: 'SHOW_INACTIVE_RADIOS', payload: true }]);
    });

    it('toggles the mapIsLocked state when the checkbox is clicked', async () => {

      const checkbox = await screen.findByText('Lock Map');
      userEvent.click(checkbox);

      const actions = store.getActions();
      expect(actions).toEqual([{ type: 'SET_MAP_LOCK_STATE', payload: true }]);
    });

    it('toggles the enable3D state when the checkbox is clicked', async () => {
      const checkbox = await screen.findByText('3D Map Terrain');
      userEvent.click(checkbox);

      const actions = store.getActions();
      expect(actions).toEqual([{ type: 'UPDATE_USER_PREFERENCES', payload: { enable3D: true } }]);
    });

    it('toggles the simplifyMapDataOnZoom state when the checkbox is clicked', async () => {
      const checkbox = await screen.findByText('Simplify Map Data on Zoom');
      userEvent.click(checkbox);

      const actions = store.getActions();
      expect(actions).toEqual([{ type: 'SET_MAP_DATA_ZOOM_SIMPLIFICATION' }]);
    });

    it('toggles the showTrackTimepoints state when the checkbox is clicked', async () => {
      const checkbox = await screen.findByText('Show Track Timepoints');
      userEvent.click(checkbox);

      const actions = store.getActions();
      expect(actions).toEqual([{ type: 'TOGGLE_TRACK_TIMEPOINTS' }]);
    });

    it('toggles the showInactiveRadios state when the checkbox is clicked', async () => {
      const checkbox = await screen.findByText('Show Inactive Radios');
      userEvent.click(checkbox);

      const actions = store.getActions();
      expect(actions).toEqual([{ type: 'SHOW_INACTIVE_RADIOS', payload: true }]);
    });

    it('toggles the showUserLocation state when the checkbox is clicked', async () => {
      const checkbox = await screen.findByText('Show My Current Location');
      userEvent.click(checkbox);

      const actions = store.getActions();
      expect(actions).toEqual([{ type: 'TOGGLE_DISPLAY_USER_LOCATION' }]);
    });

  });

  describe('the alerts tab', () => {
    test('showing the alerts iframe', async () => {
      const alertsIframe = await screen.findByTestId('settings-alertsIframe');

      expect(alertsIframe).toBeInTheDocument();
    });
  });
});


