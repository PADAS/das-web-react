import React from 'react';
import { Provider } from 'react-redux';
import { useSearchParams } from 'react-router';

import { render, screen } from '../../test-utils';
import { GPS_FORMATS } from '../../utils/location';
import { LAYER_IDS } from '../../constants';
import { mockStore } from '../../__test-helpers/MockStore';

import SettingsPane from './';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useSearchParams: jest.fn(),
}));

describe('SideBar - SettingsPane', () => {
  let store;
  beforeEach(() => {
    useSearchParams.mockImplementation(() => [new URLSearchParams()]);

    store = {
      data: {},
      view: {
        coordinateReferenceSystems: {
          selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
        },
        experimentalFeatures: {},
        mapClusterConfig: {
          data: {
            events: true,
            subjects: true,
          },
        },
        showMapNames: {
          [LAYER_IDS.SUBJECT_SYMBOLS]: { key: 'subjects', enabled: true },
          [LAYER_IDS.STATIC_SENSOR]: { key: 'stationary_subjects', enabled: false },
          [LAYER_IDS.EVENT_SYMBOLS]: { key: 'reports', enabled: true },
          [LAYER_IDS.PATROL_SYMBOLS]: { key: 'patrols', enabled: true },
        },
        simplifyMapDataOnZoom: {
          enabled: false,
        },
        systemConfig: {
          alerts_enabled: true,
        },
        timeSliderState: {
          active: false,
        },
        userPreferences: {
          playSoundForNewEvents: false,
          playSoundForNewInReachMessages: false,
          playSoundForRadioStateChangeToRed: false,
        },
      },
    };
  });

  const renderSoundFieldSet = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <SettingsPane {...props} />
    </Provider>
  );

  test('does not show the alerts tab if alerts are not enabled in the system configuration', async () => {
    store.view.systemConfig.alerts_enabled = false;
    renderSoundFieldSet();

    expect(screen.queryByRole('tab', { name: 'Alerts' })).toBeNull();
  });

  test('shows the alerts tab if alerts are enabled in the system configuration', async () => {
    renderSoundFieldSet();

    expect(screen.getByRole('tab', { name: 'Alerts' })).toBeVisible();
  });
});
